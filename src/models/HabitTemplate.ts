/**
 * HabitTemplate model — seeded, read-only for users.
 *
 * Why seeded instead of user-generated:
 * - A user-generated template marketplace is a moderation surface with no
 *   upside for a habit app. Cold-start (empty "add your first habit" screen)
 *   is solved just as well by a small curated set.
 *
 * Templates are grouped by `identityTag` — e.g., "runner" → "10-min walk",
 * "reader" → "10 pages/day". When a user creates a habit from a template,
 * the habit gets `templateId` set so we can later analyze which templates
 * convert and persist.
 */

import mongoose, { Schema, Document, Model } from "mongoose";

export interface IHabitTemplate extends Document {
  name: string;
  identityTag: string; // "runner", "reader", "mindful", "healthy", "creative"
  description: string;
  suggestedGraceDays: number;
  color: string;
  createdAt: Date;
}

const HabitTemplateSchema = new Schema<IHabitTemplate>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    identityTag: { type: String, required: true, trim: true, lowercase: true, index: true },
    description: { type: String, trim: true, maxlength: 280 },
    suggestedGraceDays: { type: Number, default: 1, min: 0, max: 7 },
    color: { type: String, default: "#7A9C6B" },
  },
  { timestamps: true }
);

HabitTemplateSchema.index({ identityTag: 1, name: 1 }, { unique: true });

export const HabitTemplate: Model<IHabitTemplate> =
  mongoose.models.HabitTemplate ||
  mongoose.model<IHabitTemplate>("HabitTemplate", HabitTemplateSchema);
