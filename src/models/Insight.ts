/**
 * Insight model — cached weekly AI insights.
 *
 * Why cache: the AI call costs money/time. We cache the result with a 7-day
 * TTL (enforced at the application layer in lib/insights.ts, not via a TTL
 * index — we want to keep historical insights for the user to browse).
 *
 * `modelUsed` is stored so we can show the user which model generated the
 * insight (transparency) and so we can re-run insights with a different model
 * later if we switch.
 */

import mongoose, { Schema, Document, Model } from "mongoose";

export interface IInsight extends Document {
  userId: mongoose.Types.ObjectId;
  content: string;
  modelUsed: string; // e.g., "tencent-hy3" or "none" for not-enough-data
  correlationsUsed: number;
  promptTokens?: number;
  completionTokens?: number;
  latencyMs?: number;
  generatedAt: Date;
  createdAt: Date;
}

const InsightSchema = new Schema<IInsight>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    content: { type: String, required: true },
    modelUsed: { type: String, required: true },
    correlationsUsed: { type: Number, default: 0 },
    promptTokens: { type: Number },
    completionTokens: { type: Number },
    latencyMs: { type: Number },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// For "find most recent insight for user"
InsightSchema.index({ userId: 1, generatedAt: -1 });

export const Insight: Model<IInsight> =
  mongoose.models.Insight || mongoose.model<IInsight>("Insight", InsightSchema);
