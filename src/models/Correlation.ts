/**
 * Correlation model — cached results of the Pearson correlation engine.
 *
 * Why cache: the engine iterates O(habits × metrics × lags) pairs, each
 * requiring a scan of the user's entry + habit log history. Doing this on
 * every dashboard load would be wasteful. We recompute on-demand via
 * `/api/correlations/recompute` (and eventually via a nightly cron).
 *
 * Why this schema:
 * - `targetMetric` is one of mood/energy/sleep — the dependent variable.
 * - `lagDays` is 0, 1, or 2 — does today's habit predict today's mood (0),
 *   tomorrow's (1), or the day-after-tomorrow's (2)?
 * - `r` is the Pearson correlation coefficient (-1 to +1).
 * - `pValue` is the two-tailed p-value, computed via t-distribution CDF
 *   (see lib/stats.ts for why not just trust simple-statistics).
 * - `n` is sample size. The UI hides correlations with n < 10 — small-n
 *   patterns are too easily false positives.
 * - `confounderWarning` is set when this habit co-occurs with another habit
 *   >80% of the time, meaning we can't separate their effects.
 *
 * CRITICAL: this collection stores *correlations*, never raw causal claims.
 * The UI copy must always say "X and Y move together" — never "X causes Y".
 */

import mongoose, { Schema, Document, Model } from "mongoose";

export type TargetMetric = "mood" | "energy" | "sleep";

export interface ICorrelation extends Document {
  userId: mongoose.Types.ObjectId;
  habitId: mongoose.Types.ObjectId;
  targetMetric: TargetMetric;
  lagDays: 0 | 1 | 2;
  r: number;
  pValue: number;
  n: number;
  confounderWarning: boolean;
  computedAt: Date;
}

const CorrelationSchema = new Schema<ICorrelation>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  habitId: { type: Schema.Types.ObjectId, ref: "Habit", required: true, index: true },
  targetMetric: { type: String, enum: ["mood", "energy", "sleep"], required: true },
  lagDays: { type: Number, enum: [0, 1, 2], required: true },
  r: { type: Number, required: true, min: -1, max: 1 },
  pValue: { type: Number, required: true, min: 0, max: 1 },
  n: { type: Number, required: true, min: 0 },
  confounderWarning: { type: Boolean, default: false },
  computedAt: { type: Date, default: Date.now },
});

// One row per (habit, metric, lag) — recompute upserts.
CorrelationSchema.index(
  { userId: 1, habitId: 1, targetMetric: 1, lagDays: 1 },
  { unique: true }
);

export const Correlation: Model<ICorrelation> =
  mongoose.models.Correlation ||
  mongoose.model<ICorrelation>("Correlation", CorrelationSchema);
