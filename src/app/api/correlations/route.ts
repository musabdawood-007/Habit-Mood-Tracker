/**
 * POST /api/correlations/recompute
 *
 * Recomputes all correlations for the current user, caches to Correlation
 * collection. Should be called nightly (Vercel Cron) or on-demand via a
 * dashboard button.
 *
 * Algorithm:
 *   For each habit of the user:
 *     For each target metric (mood, energy, sleep):
 *       For each lag (0, 1, 2):
 *         - Build aligned (x[], y[]) arrays where:
 *           x[i] = 1 if habit completed on day[i], else 0
 *           y[i] = metric value on day[i] + lagDays
 *         - Only include days where BOTH x and y have data.
 *         - Compute Pearson r + p-value.
 *         - Store in Correlation collection (upsert).
 *
 *   Also compute confounder warnings: for each pair of habits, if they
 *   co-occur >80% of the time, flag both as confounded.
 *
 *   NOTE: correlations with n < 10 are stored (so we don't recompute every
 *   call), but the UI hides them — see components/CorrelationPanel.tsx.
 */

import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import { Habit } from "@/models/Habit";
import { HabitLog } from "@/models/HabitLog";
import { Entry } from "@/models/Entry";
import { Correlation, TargetMetric } from "@/models/Correlation";
import { getSession, requireSession } from "@/lib/session";
import { computeCorrelation, coOccurrenceRate } from "@/lib/stats";
import { fromDateKey, toDateKey } from "@/lib/utils";

export async function POST() {
  const session = await getSession();
  const unauth = requireSession(session);
  if (unauth) return unauth;

  await dbConnect();

  const userId = session!.id;
  const habits = await Habit.find({ userId, active: true }).lean();
  const entries = await Entry.find({ userId }).sort({ date: 1 }).lean();
  const logs = await HabitLog.find({ userId }).sort({ date: 1 }).lean();

  if (habits.length === 0 || entries.length === 0) {
    return NextResponse.json({
      ok: true,
      message: "No habits or entries yet — nothing to compute.",
      computed: 0,
    });
  }

  // Build a map: dateKey (YYYY-MM-DD) -> { mood, energy, sleep } from entries
  const entryByDate = new Map<string, { mood: number; energy?: number; sleep?: number }>();
  for (const e of entries) {
    entryByDate.set(toDateKey(e.date), {
      mood: e.mood,
      energy: e.energyLevel ?? undefined,
      sleep: e.sleepHours ?? undefined,
    });
  }

  // Build a map: habitId -> Set of dateKeys completed
  const completedByHabit = new Map<string, Set<string>>();
  for (const h of habits) {
    completedByHabit.set(h._id.toString(), new Set());
  }
  for (const log of logs) {
    const set = completedByHabit.get(log.habitId.toString());
    if (set && log.completed) set.add(toDateKey(log.date));
  }

  // Confounder check: pairwise co-occurrence
  // If two habits share >80% of completion days, flag both as confounded.
  const confoundedHabits = new Set<string>();
  for (let i = 0; i < habits.length; i++) {
    for (let j = i + 1; j < habits.length; j++) {
      const a = completedByHabit.get(habits[i]._id.toString())!;
      const b = completedByHabit.get(habits[j]._id.toString())!;
      // Build aligned boolean arrays
      const allDays = new Set<string>([...a, ...b]);
      const aArr: number[] = [];
      const bArr: number[] = [];
      for (const d of allDays) {
        aArr.push(a.has(d) ? 1 : 0);
        bArr.push(b.has(d) ? 1 : 0);
      }
      const rate = coOccurrenceRate(aArr, bArr);
      if (rate > 0.8) {
        confoundedHabits.add(habits[i]._id.toString());
        confoundedHabits.add(habits[j]._id.toString());
      }
    }
  }

  // Compute correlations
  const metrics: TargetMetric[] = ["mood", "energy", "sleep"];
  const lags = [0, 1, 2] as const;
  let computedCount = 0;

  for (const habit of habits) {
    const completed = completedByHabit.get(habit._id.toString())!;
    const isConfounded = confoundedHabits.has(habit._id.toString());

    for (const metric of metrics) {
      for (const lag of lags) {
        // Build aligned (x[], y[]) over all entry dates where (metric) is defined
        // and where (date - lag) has a habit-completion status.
        const xs: number[] = [];
        const ys: number[] = [];

        for (const entry of entries) {
          const entryDateKey = toDateKey(entry.date);
          let metricVal: number | undefined;
          if (metric === "mood") metricVal = entry.mood;
          else if (metric === "energy") metricVal = entry.energyLevel ?? undefined;
          else if (metric === "sleep") metricVal = entry.sleepHours ?? undefined;
          if (metricVal === undefined || metricVal === null) continue;

          // The habit completion we're correlating against is on (entryDate - lag)
          const habitDate = new Date(entry.date);
          habitDate.setUTCDate(habitDate.getUTCDate() - lag);
          const habitDateKey = toDateKey(habitDate);
          const x = completed.has(habitDateKey) ? 1 : 0;
          xs.push(x);
          ys.push(metricVal);
        }

        const { r, pValue, n } = computeCorrelation({ x: xs, y: ys });

        await Correlation.updateOne(
          {
            userId,
            habitId: habit._id,
            targetMetric: metric,
            lagDays: lag,
          },
          {
            $set: {
              r,
              pValue,
              n,
              confounderWarning: isConfounded,
              computedAt: new Date(),
            },
          },
          { upsert: true }
        );
        computedCount++;
      }
    }
  }

  return NextResponse.json({
    ok: true,
    computed: computedCount,
    confoundedHabits: Array.from(confoundedHabits),
  });
}

/**
 * GET /api/correlations — list cached correlations for the user
 */
export async function GET() {
  const session = await getSession();
  const unauth = requireSession(session);
  if (unauth) return unauth;

  await dbConnect();
  const correlations = await Correlation.find({ userId: session!.id })
    .sort({ n: -1, r: -1 })
    .lean();
  return NextResponse.json({ correlations });
}
