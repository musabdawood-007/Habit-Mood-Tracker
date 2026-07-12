/**
 * GET /api/insights/weekly
 *   Returns the most recent cached weekly insight (or null if none).
 *
 * POST /api/insights/weekly
 *   Generates a fresh insight (or returns cached if < 7 days old).
 *   Triggers recompute of correlations first to ensure fresh data.
 *
 * COST GUARDRAIL:
 * - POST checks cache first. If cached insight is < 7 days old, returns it
 *   without calling the AI.
 * - If user wants a fresh insight despite cache, they pass ?force=1
 *   (TODO: add a "regenerate" button in UI later).
 */

import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import { Insight } from "@/models/Insight";
import { getSession, requireSession } from "@/lib/session";
import { generateWeeklyInsight } from "@/lib/insights";

export async function GET() {
  const session = await getSession();
  const unauth = requireSession(session);
  if (unauth) return unauth;

  await dbConnect();
  const insight = await Insight.findOne({ userId: session!.id })
    .sort({ generatedAt: -1 })
    .lean();

  return NextResponse.json({ insight: insight || null });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  const unauth = requireSession(session);
  if (unauth) return unauth;

  await dbConnect();

  const { searchParams } = new URL(req.url);
  const force = searchParams.get("force") === "1";

  try {
    // If not forced, check cache first (7-day window)
    if (!force) {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const cached = await Insight.findOne({
        userId: session!.id,
        generatedAt: { $gte: sevenDaysAgo },
      })
        .sort({ generatedAt: -1 })
        .lean();

      if (cached) {
        return NextResponse.json({ insight: cached, cached: true });
      }
    }

    // Generate fresh — this may take 20-30s
    const { insight, cached } = await generateWeeklyInsight(session!.id);
    return NextResponse.json({ insight, cached });
  } catch (err: any) {
    console.error("[insights/weekly] error:", err);
    return NextResponse.json(
      { error: "Failed to generate insight", message: err.message },
      { status: 500 }
    );
  }
}
