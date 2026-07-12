/**
 * Streak logic — current streak + longest streak, with grace days.
 *
 * Why grace days:
 * - Atomic Habits + ADHD-friendly design principle: a missed day shouldn't
 *   nuke a 47-day streak. The brief specifies `graceDaysPerWeek` per habit.
 *
 * Algorithm (trailing 7-day window):
 * - Walk back day-by-day from today (or from `asOf` date if provided).
 * - Maintain a rolling 7-day window of "did I complete on this day?" (true/false).
 * - A day is "missed" if no HabitLog with completed=true exists for it.
 * - If missed count within the trailing 7 days > graceDaysPerWeek, the streak
 *   breaks AT that day.
 *
 * Example (grace = 1):
 *   Day:    Mon Tue Wed Thu Fri Sat Sun
 *   Done?:  ✓   ✓   ✓   ✗   ✓   ✗   ✗
 *                                  ↑
 *                                  Sat+Sun both missed within trailing 7-day window
 *                                  (missed=2 > grace=1) → streak breaks here.
 *
 *   Current streak counted from today backward: 0 (today is Sun, missed)
 *   Wait — re-walk: trailing 7-day window from Sun includes Mon-Sun.
 *   Missed in that window: Thu, Sun (Thu was earlier missed; Sun is today).
 *   Hmm — need to be careful: only count COMPLETED days in streak.
 *
 * Refined algorithm:
 * - Streak counts CONSECUTIVE DAYS where the habit was completed, allowing
 *   grace days to "patch over" missed days within a 7-day window.
 * - Walk backward. For each day:
 *   - If completed, increment streak by 1, shift window.
 *   - If not completed, check trailing 7-day window (including today): how
 *     many missed in this window? If missed_count <= graceDaysPerWeek, skip
 *     this day (don't break, don't count). If missed_count > grace, break.
 *
 * Let me simplify with a cleaner approach: forward-walk from habit creation
 * date, but that's expensive. Backward-walk is fine.
 *
 * SIMPLER FINAL ALGORITHM:
 * - For each day going backward from today:
 *   - track `missedInLast7Days` (count of non-completed days in trailing 7)
 *   - if today is completed: streak++, missed=0 in window
 *   - if today is missed:
 *     - if missedInLast7Days <= grace: continue (grace patches it)
 *     - else: break
 *
 * NOTE: "today" might be missed because user hasn't logged yet. We DON'T
 * count today as a break — only past days. So we start from yesterday if
 * today is not yet completed.
 */

import { HabitLog } from "@/models/HabitLog";

export interface StreakResult {
  current: number;
  longest: number;
  lastCompletedDate: Date | null;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / 86_400_000);
}

export async function calculateStreak(
  habitId: string,
  graceDaysPerWeek: number,
  asOf: Date = new Date()
): Promise<StreakResult> {
  // Fetch all completed logs for this habit, sorted ascending by date.
  const logs = await HabitLog.find({
    habitId,
    completed: true,
  })
    .sort({ date: 1 })
    .select("date -_id")
    .lean();

  if (logs.length === 0) {
    return { current: 0, longest: 0, lastCompletedDate: null };
  }

  // Build a Set of completed day-strings (YYYY-MM-DD UTC) for O(1) lookup.
  const completedDays = new Set<string>();
  for (const log of logs) {
    completedDays.add(startOfDay(log.date).toISOString().slice(0, 10));
  }

  const lastCompletedDate = startOfDay(logs[logs.length - 1].date);

  // ---- LONGEST STREAK (forward walk) ----
  // Walk from first completed day to today, applying grace logic.
  let longest = 0;
  let current = 0;
  let missedInWindow = 0;
  const windowStart = new Date(logs[0].date); // first day we started tracking
  const end = startOfDay(asOf);

  for (let d = startOfDay(windowStart); d <= end; d = addDays(d, 1)) {
    const key = d.toISOString().slice(0, 10);
    if (completedDays.has(key)) {
      current++;
      // Reset grace window — a completed day starts fresh accounting
      // (simplification: we don't carry missed days forward across a completed day)
      missedInWindow = 0;
    } else {
      missedInWindow++;
      if (missedInWindow > graceDaysPerWeek) {
        // streak breaks — but we count this day's miss only after the streak
        // already established. The break point is the day BEFORE this streak of misses.
        longest = Math.max(longest, current);
        current = 0;
        missedInWindow = 0;
      }
      // else: grace patches it, continue without breaking
    }
  }
  longest = Math.max(longest, current);

  // ---- CURRENT STREAK (backward walk from today) ----
  // If today is completed, count from today. If not, start from yesterday
  // (today isn't a break — user may still log it).
  let currentStreak = 0;
  let cursor = end;
  const todayKey = end.toISOString().slice(0, 10);
  if (!completedDays.has(todayKey)) {
    cursor = addDays(end, -1); // start from yesterday
  }

  // Walk backward, tracking missed in trailing 7-day window.
  let missedInTrailing7 = 0;
  const window7: boolean[] = []; // true = completed, false = missed
  for (let i = 0; i < 365 * 3; i++) { // cap at 3 years
    const key = cursor.toISOString().slice(0, 10);
    const done = completedDays.has(key);

    window7.unshift(done);
    if (window7.length > 7) window7.pop();
    missedInTrailing7 = window7.filter((x) => !x).length;

    if (done) {
      currentStreak++;
    } else {
      if (missedInTrailing7 > graceDaysPerWeek) {
        break;
      }
      // else: grace patches, don't increment, don't break
    }

    cursor = addDays(cursor, -1);
    // Stop if we're before the habit's first completed log
    if (cursor < startOfDay(logs[0].date)) break;
  }

  return {
    current: currentStreak,
    longest,
    lastCompletedDate,
  };
}

// Helper for UI: format date as YYYY-MM-DD in user's local tz (approx via UTC)
export function formatDateKey(d: Date): string {
  return startOfDay(d).toISOString().slice(0, 10);
}
