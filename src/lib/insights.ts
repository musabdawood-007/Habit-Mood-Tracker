/**
 * AI Insights library — generates weekly narrative summaries from the user's
 * precomputed correlations.
 *
 * DESIGN PRINCIPLES (non-negotiable):
 * 1. NEVER pass raw logs to the AI. Only pass precomputed correlations (r, p, n).
 *    This means the AI narrates REAL numbers, not vibes.
 * 2. NEVER claim causation. The system prompt explicitly forbids it.
 * 3. Hide correlations with n < 10 before they reach the AI — small-n patterns
 *    are noise; we don't want them in the narrative.
 * 4. Cache the generated summary — don't re-call the API on every dashboard
 *    load. Cache lives in the Insights mongo collection (7-day TTL).
 *
 * PROVIDER: bynara.id router (OpenAI-compatible). The model `tencent-hy3` was
 * tested and produces good output on the user's plan (free).
 *
 * COST GUARDRAILS:
 * - On-demand only (user clicks "Generate weekly insight")
 * - 7-day cache TTL — re-calling within a week returns cached
 * - max_tokens capped at 400
 * - Skips API call entirely if no significant correlations exist
 */

import { dbConnect } from "@/lib/dbConnect";
import { Correlation, ICorrelation, TargetMetric } from "@/models/Correlation";
import { Habit } from "@/models/Habit";
import { Insight, IInsight } from "@/models/Insight";
import { describeR } from "@/lib/stats";

const API_BASE = process.env.AI_API_BASE;
const API_KEY = process.env.AI_API_KEY;
const MODEL = process.env.AI_MODEL || "tencent-hy3";

interface CorrelationForAI {
  habitName: string;
  targetMetric: TargetMetric;
  lagDays: number;
  r: number;
  pValue: number;
  n: number;
  confounderWarning: boolean;
}

/**
 * Fetch and prepare correlations for the AI prompt.
 * - Filters out n < 10 (too noisy)
 * - Filters out p > 0.1 (not even suggestive)
 * - Sorts by |r| descending so strongest patterns are first
 * - Caps at top 8 to keep prompt size reasonable
 */
async function getTopCorrelationsForUser(
  userId: string
): Promise<CorrelationForAI[]> {
  await dbConnect();

  const [correlations, habits] = await Promise.all([
    Correlation.find({ userId }).lean(),
    Habit.find({ userId, active: true }).lean(),
  ]);

  const habitMap = new Map(habits.map((h: any) => [h._id.toString(), h.name]));

  return (correlations as any[])
    .filter((c: any) => c.n >= 10 && c.pValue <= 0.1)
    .map((c: any) => ({
      habitName: habitMap.get(c.habitId.toString()) || "Unknown habit",
      targetMetric: c.targetMetric,
      lagDays: c.lagDays,
      r: c.r,
      pValue: c.pValue,
      n: c.n,
      confounderWarning: c.confounderWarning,
    }))
    .sort((a, b) => Math.abs(b.r) - Math.abs(a.r))
    .slice(0, 8);
}

function formatCorrelationsForPrompt(corrs: CorrelationForAI[]): string {
  if (corrs.length === 0) {
    return "(No statistically meaningful correlations found yet. The user may need more data.)";
  }

  return corrs
    .map((c, i) => {
      const lagDesc =
        c.lagDays === 0
          ? "same-day"
          : c.lagDays === 1
          ? "next-day"
          : "2-day-lag";
      const sigDesc =
        c.pValue < 0.01
          ? "highly significant"
          : c.pValue < 0.05
          ? "significant"
          : "suggestive";
      const confounderNote = c.confounderWarning
        ? " ⚠ correlated with another habit (entangled effect)"
        : "";
      return `${i + 1}. "${c.habitName}" → ${lagDesc} ${c.targetMetric}: r=${c.r.toFixed(
        2
      )}, n=${c.n}, p=${c.pValue.toFixed(3)} (${describeR(c.r)}, ${sigDesc})${confounderNote}`;
    })
    .join("\n");
}

const SYSTEM_PROMPT = `You are a concise, statistically-honest insights writer for a habit & mood tracking app.

NON-NEGOTIABLE RULES:
1. NEVER claim causation. Use "associated with", "moves with", "tends to", "goes with" — never "causes", "makes", "leads to", "results in".
2. Always mention sample size (n) when describing a correlation.
3. Skip correlations that are NOT statistically significant (p > 0.05) — they're likely noise.
4. If a correlation has a confounder warning, mention that the effect may be entangled with another habit.
5. If no significant correlations exist, say so honestly — don't fabricate patterns.
6. Tone: warm, brief, honest. No hype, no enthusiasm, no exclamation marks.
7. End with ONE actionable suggestion grounded in the data, never pressuring.

Output: exactly 3 sentences. No preamble, no headers, no markdown.`;

function buildUserPrompt(corrs: CorrelationForAI[]): string {
  const corrText = formatCorrelationsForPrompt(corrs);
  return `Based on these correlations from the user's tracking data (last 30+ days), write a 3-sentence weekly insight:

${corrText}

Remember: never claim causation, mention n, skip non-significant patterns, end with one grounded suggestion.`;
}

/**
 * Generate (or return cached) weekly insight for the user.
 *
 * Cache behavior:
 * - If a cached insight exists and is < 7 days old, return it.
 * - Otherwise, call the AI and cache the new result.
 */
export async function generateWeeklyInsight(
  userId: string
): Promise<{ insight: IInsight; cached: boolean }> {
  await dbConnect();

  // Check cache (insight from last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const cached = await Insight.findOne({
    userId,
    generatedAt: { $gte: sevenDaysAgo },
  }).sort({ generatedAt: -1 });

  if (cached) {
    return { insight: cached, cached: true };
  }

  // Fetch top correlations
  const corrs = await getTopCorrelationsForUser(userId);

  // If no significant correlations, return a "not enough data" insight
  // WITHOUT calling the AI — saves cost.
  if (corrs.length === 0) {
    const noDataInsight = await Insight.create({
      userId,
      content:
        "Not enough meaningful patterns yet. Keep logging daily — once you have ~10 days of data with at least one habit showing a real correlation, your weekly insight will appear here.",
      modelUsed: "none",
      correlationsUsed: 0,
      generatedAt: new Date(),
    });
    return { insight: noDataInsight, cached: false };
  }

  // Call the AI
  const userPrompt = buildUserPrompt(corrs);

  const start = Date.now();
  const res = await fetch(`${API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 400,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`AI API error: HTTP ${res.status} — ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("AI API returned empty content");
  }

  const latencyMs = Date.now() - start;

  const insight = await Insight.create({
    userId,
    content,
    modelUsed: MODEL,
    correlationsUsed: corrs.length,
    promptTokens: data.usage?.prompt_tokens,
    completionTokens: data.usage?.completion_tokens,
    latencyMs,
    generatedAt: new Date(),
  });

  return { insight, cached: false };
}
