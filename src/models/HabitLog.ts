/**
 * HabitLog model — records whether a habit was completed on a given day.
 *
 * Design decisions:
 * - One document per (habit, date) — `completed` is a bool, not a count.
 *   The brief specifies daily habits only (not "X times per day"), which
 *   keeps the schema simple and the streak algorithm clean.
 * - Unique index on {habitId, date} prevents duplicate logs. Upsert pattern
 *   in the API route uses this index to make toggle idempotent.
 * - We DON'T store "0 / completed=false" rows for every missed day — that
 *   would bloat the collection. Instead, absence of a log = not completed,
 *   and the streak algorithm handles the gap (see lib/streaks.ts).
 * - `date` is midnight UTC of the user's local calendar day, matching Entry.
 */

import mongoose, { Schema, Document, Model } from "mongoose";

export interface IHabitLog extends Document {
  habitId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId; // denormalized for fast per-user queries
  date: Date;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const HabitLogSchema = new Schema<IHabitLog>(
  {
    habitId: { type: Schema.Types.ObjectId, ref: "Habit", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    date: { type: Date, required: true },
    completed: { type: Boolean, default: true },
  },
  { timestamps: true }
);

HabitLogSchema.index({ habitId: 1, date: 1 }, { unique: true });
HabitLogSchema.index({ userId: 1, date: 1 }); // for "what did I do today?" query

export const HabitLog: Model<IHabitLog> =
  mongoose.models.HabitLog || mongoose.model<IHabitLog>("HabitLog", HabitLogSchema);
