"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Habit {
  _id: string;
  name: string;
  color?: string;
  graceDaysPerWeek: number;
}

interface Props {
  habits: Habit[];
  initialCompleted: Set<string>;
  todayKey: string;
}

export default function HabitToggleList({ habits, initialCompleted, todayKey }: Props) {
  const [completed, setCompleted] = useState<Set<string>>(initialCompleted);
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [justCompleted, setJustCompleted] = useState<Set<string>>(new Set());

  async function toggle(habitId: string) {
    const next = new Set(completed);
    const newValue = !next.has(habitId);
    if (newValue) {
      next.add(habitId);
      // Trigger celebration animation
      setJustCompleted((s) => new Set(s).add(habitId));
      setTimeout(() => {
        setJustCompleted((s) => {
          const n = new Set(s);
          n.delete(habitId);
          return n;
        });
      }, 800);
    } else {
      next.delete(habitId);
    }
    setCompleted(next);

    setPending((p) => new Set(p).add(habitId));
    try {
      const res = await fetch("/api/habit-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          habitId,
          date: todayKey,
          completed: newValue,
        }),
      });
      if (!res.ok) throw new Error("Failed to update");
    } catch {
      // Revert on failure
      setCompleted(completed);
    } finally {
      setPending((p) => {
        const n = new Set(p);
        n.delete(habitId);
        return n;
      });
    }
  }

  if (habits.length === 0) return null;

  return (
    <ul className="space-y-2">
      {habits.map((habit) => {
        const isDone = completed.has(habit._id);
        const isPending = pending.has(habit._id);
        const isCelebrating = justCompleted.has(habit._id);
        return (
          <li key={habit._id}>
            <button
              onClick={() => toggle(habit._id)}
              disabled={isPending}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left relative overflow-hidden",
                isDone
                  ? "border-sage-300 bg-sage-50 dark:bg-sage-900/30 dark:border-sage-700"
                  : "border-sage-100 dark:border-sage-800/50 bg-white dark:bg-bg-dark/50 hover:border-sage-200 dark:hover:border-sage-700",
                isPending && "opacity-60",
                isCelebrating && "scale-[1.02]"
              )}
            >
              {/* Celebration burst */}
              {isCelebrating && (
                <span className="absolute inset-0 pointer-events-none">
                  <span className="absolute top-1/2 left-3 w-2 h-2 rounded-full bg-sage-400 animate-ping" />
                  <span className="absolute top-1/2 right-3 w-2 h-2 rounded-full bg-sage-400 animate-ping" style={{ animationDelay: "0.1s" }} />
                </span>
              )}

              <span
                className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                  isDone
                    ? "bg-sage-500 border-sage-500 scale-110"
                    : "border-sage-300 dark:border-sage-700"
                )}
              >
                {isDone && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
              </span>
              <span className={cn(
                "flex-1 font-medium text-sm transition-colors",
                isDone && "text-sage-700 dark:text-sage-200"
              )}>
                {habit.name}
              </span>
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: habit.color || "#7A9C6B" }}
              />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
