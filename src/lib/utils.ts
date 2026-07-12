/**
 * Utility: clsx + tailwind-merge. Avoids Tailwind class conflicts when
 * composing component variants.
 *
 * Pattern: `cn("p-4", isActive && "bg-sage-500", className)`
 */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date as YYYY-MM-DD using UTC (matches our DB convention).
 */
export function toDateKey(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toISOString().slice(0, 10);
}

/**
 * Convert a YYYY-MM-DD string into a Date at UTC midnight.
 * (Why UTC: prevents timezone drift causing "wrong day" in queries.)
 */
export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/**
 * Format mood (1-5) to emoji for display.
 */
export function moodToEmoji(mood: number): string {
  const map: Record<number, string> = {
    1: "😞",
    2: "😕",
    3: "😐",
    4: "🙂",
    5: "😄",
  };
  return map[mood] || "😐";
}

export function moodToLabel(mood: number): string {
  const map: Record<number, string> = {
    1: "Awful",
    2: "Low",
    3: "Okay",
    4: "Good",
    5: "Great",
  };
  return map[mood] || "Okay";
}
