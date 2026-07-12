/**
 * Statistical correlation utilities (Milestone B).
 *
 * Why two libraries:
 * - `simple-statistics` gives us Pearson r — but NOT the p-value.
 * - To convert r → p-value, we use the t-distribution CDF from `jstat`.
 *   Formula: t = r * sqrt(n-2) / sqrt(1 - r^2), with n-2 degrees of freedom.
 *   p (two-tailed) = 2 * (1 - T_cdf(|t|, df)).
 *
 * Why p-value matters:
 * - With small n, ANY pattern can look correlated by chance. p < 0.05 means
 *   "fewer than 5% chance of seeing a correlation this strong if the true
 *   correlation were zero." We display p alongside r in the UI so the user
 *   can judge for themselves.
 *
 * Why lag days:
 * - Lag 0: "habit and mood on the same day move together" — no direction info.
 * - Lag 1: "habit on day N predicts mood on day N+1" — closer to cause→effect.
 * - Lag 2: longer carryover — useful for sleep especially (sleep affects mood
 *   for 1-2 days after).
 *
 * Confounder check:
 * - If two habits co-occur >80% of the time, their individual correlations
 *   with mood are entangled — we can't say which one is "really" driving it.
 *   We flag this with `confounderWarning: true` so the UI can show a note.
 */

import { sampleCorrelation as correlation, mean, standardDeviation } from "simple-statistics";
import jstat from "jstat";

export interface CorrelationInput {
  x: number[]; // habit completion: 0 or 1 per day
  y: number[]; // mood / energy / sleep value per day
}

export interface CorrelationResult {
  r: number;
  pValue: number;
  n: number;
}

/**
 * Compute Pearson correlation + p-value.
 * Returns n=0 if insufficient data.
 */
export function computeCorrelation(input: CorrelationInput): CorrelationResult {
  const { x, y } = input;
  const n = Math.min(x.length, y.length);

  if (n < 3) return { r: 0, pValue: 1, n };

  // simple-statistics requires same-length arrays
  const xs = x.slice(0, n);
  const ys = y.slice(0, n);

  // Edge case: if all x are 0 or all x are 1, std is 0, correlation is undefined.
  const xMean = mean(xs);
  const xStd = standardDeviation(xs);
  if (xStd === 0) return { r: 0, pValue: 1, n };

  const r = correlation(xs, ys);

  // Convert r → p-value via t-distribution
  // t = r * sqrt(n-2) / sqrt(1 - r^2)
  // df = n - 2
  // p (two-tailed) = 2 * (1 - T_cdf(|t|, df))
  const df = n - 2;
  const tStat = (r * Math.sqrt(df)) / Math.sqrt(1 - Math.min(r * r, 0.999999));
  const pValue = 2 * (1 - jstat.studentt.cdf(Math.abs(tStat), df));

  return { r: Number(r.toFixed(4)), pValue: Number(pValue.toFixed(4)), n };
}

/**
 * Confounder co-occurrence check.
 * Given two boolean arrays (same length = same days), what fraction of days
 * did both happen? If > 0.8, they're too entangled to separate.
 */
export function coOccurrenceRate(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n === 0) return 0;
  let both = 0;
  let either = 0;
  for (let i = 0; i < n; i++) {
    if (a[i] === 1 && b[i] === 1) both++;
    if (a[i] === 1 || b[i] === 1) either++;
  }
  return either === 0 ? 0 : both / either;
}

/**
 * Format r for UI display.
 * r in [-1, 1] — positive means habit completion goes with higher metric.
 */
export function describeR(r: number): string {
  const abs = Math.abs(r);
  const sign = r > 0 ? "positive" : "negative";
  let strength: string;
  if (abs < 0.1) strength = "negligible";
  else if (abs < 0.3) strength = "weak";
  else if (abs < 0.5) strength = "moderate";
  else if (abs < 0.7) strength = "strong";
  else strength = "very strong";
  return `${strength} ${sign}`;
}

/**
 * Format p-value for UI display.
 * Lower p = more significant. p < 0.05 is conventional "statistically significant".
 */
export function describeP(p: number): string {
  if (p < 0.01) return "highly significant (p < 0.01)";
  if (p < 0.05) return "statistically significant (p < 0.05)";
  if (p < 0.1) return "suggestive (p < 0.1)";
  return "not significant (p ≥ 0.1)";
}
