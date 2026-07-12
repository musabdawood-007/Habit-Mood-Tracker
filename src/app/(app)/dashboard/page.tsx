/**
 * Dashboard — overview of mood trend, habit completion, identity consistency.
 */

import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/dbConnect";
import { Entry } from "@/models/Entry";
import { Habit } from "@/models/Habit";
import { HabitLog } from "@/models/HabitLog";
import { Identity } from "@/models/Identity";
import { toDateKey, fromDateKey, moodToEmoji, moodToLabel } from "@/lib/utils";
import { calculateStreak } from "@/lib/streaks";
import MoodTrendChart from "@/components/MoodTrendChart";
import HabitToggleList from "@/components/HabitToggleList";
import HeatmapCalendar from "@/components/HeatmapCalendar";
import InsightsPanel from "@/components/InsightsPanel";
import CorrelationPanel from "@/components/CorrelationPanel";
import { Plus, TrendingUp, Flame, Target, Calendar, Sparkles } from "lucide-react";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  await dbConnect();
  const userId = (session?.user as any)?.id;
  if (!userId) return null;

  // ---- Fetch data ----
  const today = new Date();
  const todayKey = toDateKey(today);
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [entries, habits, identities, todayLogs] = await Promise.all([
    Entry.find({ userId, date: { $gte: thirtyDaysAgo } }).sort({ date: 1 }).lean(),
    Habit.find({ userId, active: true }).sort({ createdAt: 1 }).lean(),
    Identity.find({ userId, active: true }).lean(),
    HabitLog.find({ userId, date: fromDateKey(todayKey) }).lean(),
  ]);

  const todayEntry = entries.find((e) => toDateKey(e.date) === todayKey);
  const completedToday = new Set(todayLogs.filter((l) => l.completed).map((l) => l.habitId.toString()));

  // ---- Identity consistency ----
  const identityConsistency = await Promise.all(
    identities.map(async (identity) => {
      const habitsForIdentity = habits.filter(
        (h) => h.identityId?.toString() === identity._id.toString()
      );
      if (habitsForIdentity.length === 0) {
        return { identity, percent: 0, daysCompleted: 0, totalDays: 30 };
      }
      const habitIds = new Set(habitsForIdentity.map((h) => h._id.toString()));
      const logsForIdentity = await HabitLog.find({
        userId,
        habitId: { $in: Array.from(habitIds) },
        completed: true,
        date: { $gte: thirtyDaysAgo },
      })
        .select("date -_id")
        .lean();
      const daysCompleted = new Set(logsForIdentity.map((l) => toDateKey(l.date))).size;
      return {
        identity,
        percent: Math.round((daysCompleted / 30) * 100),
        daysCompleted,
        totalDays: 30,
      };
    })
  );

  // ---- Streaks ----
  const streaks = await Promise.all(
    habits.map(async (h) => ({
      habit: h,
      streak: await calculateStreak(h._id.toString(), h.graceDaysPerWeek),
    }))
  );

  // ---- Mood trend ----
  const moodTrendData = entries.map((e) => ({
    date: toDateKey(e.date),
    mood: e.mood,
    label: moodToLabel(e.mood),
  }));

  // ---- Heatmap ----
  const firstHabit = habits[0];
  let heatmapData: { date: string; completed: boolean }[] = [];
  if (firstHabit) {
    const logs = await HabitLog.find({
      userId,
      habitId: firstHabit._id,
      date: { $gte: new Date(today.getTime() - 90 * 86_400_000) },
    }).lean();
    heatmapData = logs.map((l) => ({
      date: toDateKey(l.date),
      completed: l.completed,
    }));
  }

  const todayStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
          <p className="text-sm text-ink-muted dark:text-sage-300/80">{todayStr}</p>
        </div>
        {!todayEntry && (
          <Link href="/check-in" className="btn-primary group">
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
            Check in for today
          </Link>
        )}
      </div>

      {/* Today's mood quick view */}
      {todayEntry ? (
        <div className="card-soft flex items-center gap-4">
          <span className="text-5xl">{moodToEmoji(todayEntry.mood)}</span>
          <div className="flex-1">
            <p className="text-xs text-ink-muted dark:text-sage-300/70 uppercase tracking-wide font-medium">
              Today
            </p>
            <p className="font-semibold text-lg">
              {moodToLabel(todayEntry.mood)} mood
            </p>
            <p className="text-sm text-ink-muted dark:text-sage-300/80">
              {todayEntry.sleepHours && ` · ${todayEntry.sleepHours}h sleep`}
              {todayEntry.energyLevel && ` · ${todayEntry.energyLevel}/5 energy`}
            </p>
          </div>
          <Link href="/check-in" className="btn-ghost text-sm">
            Edit
          </Link>
        </div>
      ) : (
        <Link href="/check-in" className="block">
          <div className="card-soft border-dashed border-2 border-sage-200 dark:border-sage-800 hover:border-sage-400 dark:hover:border-sage-600 transition-colors group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-sage-100 dark:bg-sage-900/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus className="w-5 h-5 text-sage-600 dark:text-sage-300" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">No check-in yet today</p>
                <p className="text-sm text-ink-muted dark:text-sage-300/80">
                  Tap to log your mood — takes 10 seconds.
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-ink-muted dark:text-sage-300/70 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        {/* Mood trend */}
        <div className="card md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-sage-500" />
              <h2 className="font-semibold">Mood trend · last 30 days</h2>
            </div>
          </div>
          {moodTrendData.length > 0 ? (
            <MoodTrendChart data={moodTrendData} />
          ) : (
            <div className="py-12 text-center">
              <div className="inline-flex w-12 h-12 rounded-xl bg-sage-100 dark:bg-sage-900/50 items-center justify-center mb-3">
                <TrendingUp className="w-5 h-5 text-sage-500" />
              </div>
              <p className="text-sm text-ink-muted dark:text-sage-300/80 mb-3">
                No mood entries yet.
              </p>
              <Link href="/check-in" className="btn-secondary text-sm">
                Add your first check-in →
              </Link>
            </div>
          )}
        </div>

        {/* Identity consistency */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-4 h-4 text-sage-500" />
            <h2 className="font-semibold">Identity consistency</h2>
          </div>
          {identityConsistency.length > 0 ? (
            <ul className="space-y-3">
              {identityConsistency.map(({ identity, percent, daysCompleted, totalDays }) => (
                <li key={identity._id.toString()}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium">{identity.name}</span>
                    <span className="text-ink-muted dark:text-sage-300/70 text-xs">
                      {daysCompleted}/{totalDays} · {percent}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-sage-100 dark:bg-sage-900/50 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${percent}%`,
                        backgroundColor: identity.color || "#5C7E4D",
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-8 text-center">
              <p className="text-sm text-ink-muted dark:text-sage-300/80 mb-3">
                No identities yet.
              </p>
              <Link href="/habits" className="btn-secondary text-sm">
                Create one →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Today's habits */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sage-500" />
            <h2 className="font-semibold">Today&rsquo;s habits</h2>
            {completedToday.size > 0 && (
              <span className="pill bg-sage-100 text-sage-700 dark:bg-sage-900/50 dark:text-sage-200">
                {completedToday.size}/{habits.length} done
              </span>
            )}
          </div>
          <Link href="/habits" className="text-sm text-sage-600 dark:text-sage-300 hover:underline">
            Manage →
          </Link>
        </div>
        {habits.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-ink-muted dark:text-sage-300/80 mb-3">
              No habits yet. Start with a template — they&rsquo;re curated.
            </p>
            <Link href="/habits" className="btn-secondary text-sm">
              Add your first habit →
            </Link>
          </div>
        ) : (
          <HabitToggleList habits={habits} initialCompleted={completedToday} todayKey={todayKey} />
        )}
      </div>

      {/* Streaks */}
      {streaks.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-4 h-4 text-sun-500" />
            <h2 className="font-semibold">Streaks (with grace days)</h2>
          </div>
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {streaks.map(({ habit, streak }) => (
              <li
                key={habit._id.toString()}
                className="rounded-xl border border-sage-100 dark:border-sage-800/50 p-4 hover:border-sage-300 dark:hover:border-sage-700 transition-colors"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: habit.color || "#7A9C6B" }}
                  />
                  <span className="font-medium text-sm truncate">{habit.name}</span>
                </div>
                <div className="flex gap-4 text-sm">
                  <div>
                    <p className="text-ink-muted dark:text-sage-300/70 text-xs uppercase tracking-wide">Current</p>
                    <p className={`text-2xl font-bold ${streak.current > 0 ? "text-sage-600 dark:text-sage-300" : "text-ink-muted dark:text-sage-300/50"}`}>
                      {streak.current}
                    </p>
                  </div>
                  <div>
                    <p className="text-ink-muted dark:text-sage-300/70 text-xs uppercase tracking-wide">Longest</p>
                    <p className="text-2xl font-bold">{streak.longest}</p>
                  </div>
                  <div>
                    <p className="text-ink-muted dark:text-sage-300/70 text-xs uppercase tracking-wide">Grace/wk</p>
                    <p className="text-2xl font-bold text-ink-muted dark:text-sage-300/70">{habit.graceDaysPerWeek}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Heatmap */}
      {firstHabit && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-sage-500" />
            <h2 className="font-semibold">{firstHabit.name} · last 90 days</h2>
          </div>
          <HeatmapCalendar data={heatmapData} />
        </div>
      )}

      {/* AI Weekly Insight + Correlations */}
      <div className="grid lg:grid-cols-2 gap-4">
        <InsightsPanel />
        <CorrelationPanel
          habitNames={Object.fromEntries(habits.map((h) => [h._id.toString(), h.name]))}
        />
      </div>
    </div>
  );
}

function ArrowRight({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}
