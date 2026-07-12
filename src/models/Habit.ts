/**
 * Habit model.
 *
 * Design decisions:
 * - `graceDaysPerWeek` lives on the habit, not the user. A user might want 2
 *   grace days for "gym" (life happens) but 0 for "take meds" (non-negotiable).
 *   Defaults from user.settings.graceDaysPerWeek at creation time.
 * - `identityId` is optional — a habit can float free, or be tied to an
 *   identity for the identity-consistency dashboard panel.
 * - `templateId` is optional — if this habit was created from a seeded
 *   template, we keep the link for analytics (which templates convert best?).
 * - `active` is a soft-delete flag. Hard-deleting a habit would orphan its
 *   HabitLog entries and break historical streaks. Soft-delete preserves
 *   history.
 * - `color` for UI badges / heatmap calendar.
 */

import mongoose, { Schema, Document, Model } from "mongoose";

export interface IHabit extends Document {
  userId: mongoose.Types.ObjectId;
  identityId?: mongoose.Types.ObjectId | null;
  name: string;
  description?: string | null;
  color?: string;
  active: boolean;
  graceDaysPerWeek: number;
  templateId?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const HabitSchema = new Schema<IHabit>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    identityId: { type: Schema.Types.ObjectId, ref: "Identity", default: null, index: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, trim: true, maxlength: 280, default: null },
    color: { type: String, default: "#7A9C6B" },
    active: { type: Boolean, default: true, index: true },
    graceDaysPerWeek: { type: Number, default: 1, min: 0, max: 7 },
    templateId: { type: Schema.Types.ObjectId, ref: "HabitTemplate", default: null },
  },
  { timestamps: true }
);

HabitSchema.index({ userId: 1, name: 1 }, { unique: true });

export const Habit: Model<IHabit> =
  mongoose.models.Habit || mongoose.model<IHabit>("Habit", HabitSchema);
