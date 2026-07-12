"use client";

/**
 * GitHub-style heatmap calendar for a single habit.
 * 7 rows (days of week) × N columns (weeks). Green = completed, light = not.
 *
 * Uses pure CSS grid — no charting library needed for this.
 */

interface DayCell {
  date: string; // YYYY-MM-DD
  completed: boolean;
}

interface Props {
  data: DayCell[];
}

export default function HeatmapCalendar({ data }: Props) {
  const completedSet = new Set(data.filter((d) => d.completed).map((d) => d.date));

  // Build last 91 days (13 weeks)
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const days: DayCell[] = [];
  for (let i = 90; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push({ date: key, completed: completedSet.has(key) });
  }

  // Group into weeks (columns of 7)
  const weeks: DayCell[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <div className="overflow-x-auto scroll-area">
      <div className="flex gap-1 min-w-max pb-2">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((day) => (
              <div
                key={day.date}
                title={`${day.date}: ${day.completed ? "Completed" : "Not completed"}`}
                className={`w-3.5 h-3.5 rounded-sm ${
                  day.completed
                    ? "bg-sage-500"
                    : "bg-sage-100 dark:bg-sage-900"
                }`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-3 text-xs text-ink-muted">
        <span>Less</span>
        <div className="w-3 h-3 rounded-sm bg-sage-100" />
        <div className="w-3 h-3 rounded-sm bg-sage-300" />
        <div className="w-3 h-3 rounded-sm bg-sage-500" />
        <div className="w-3 h-3 rounded-sm bg-sage-700" />
        <span>More</span>
      </div>
    </div>
  );
}
