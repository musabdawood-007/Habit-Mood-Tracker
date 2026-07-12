/**
 * Entry model — the daily mood check-in.
 *
 * Design decisions:
 * - `mood` and `energyLevel` are 1-5 integer scales (not 1-10 or 1-100) because
 *   5 buckets are enough granularity for self-report, and faster to tap on
 *   mobile (low-friction UX principle from the brief).
 * - `sleepHours` is a float (not integer) — 7.5h is a common real value.
 * - `date` is stored as a Date at midnight UTC of the user's local day. The
 *   unique index on {userId, date} prevents duplicate entries for the same day.
 *   NOTE: timezone handling — the client should send `YYYY-MM-DD` (the user's
 *   local calendar date); the server stores it as a Date at UTC midnight.
 *   This means a single user always has one entry per calendar day, regardless
 *   of where they travel.
 * - `note` is optional and unbounded — but we'll cap at 5000 chars at the API
 *   layer to prevent abuse.
 */

import mongoose, { Schema, Document, Model } from "mongoose";

export interface IEntry extends Document {
  userId: mongoose.Types.ObjectId;
  date: Date; // midnight UTC of the user's local calendar day
  mood: number; // 1-5
  sleepHours?: number | null; // 0-24
  energyLevel?: number | null; // 1-5
  note?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const EntrySchema = new Schema<IEntry>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    date: { type: Date, required: true },
    mood: { type: Number, required: true, min: 1, max: 5 },
    sleepHours: { type: Number, min: 0, max: 24, default: null },
    energyLevel: { type: Number, min: 1, max: 5, default: null },
    note: { type: String, maxlength: 5000, default: null, trim: true },
  },
  { timestamps: true }
);

// One entry per user per day. Critical for streak + correlation logic.
EntrySchema.index({ userId: 1, date: 1 }, { unique: true });

// For range queries ("last 30 days") — covered by the compound index above.

export const Entry: Model<IEntry> =
  mongoose.models.Entry || mongoose.model<IEntry>("Entry", EntrySchema);
