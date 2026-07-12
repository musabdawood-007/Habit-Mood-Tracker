/**
 * GET /api/entries — list entries for the current user (optionally filtered by date range)
 * POST /api/entries — create or upsert an entry for a date
 *
 * Upsert semantics: one entry per user per day. If a POST comes in for a date
 * that already has an entry, we update it instead of erroring. The unique
 * index on {userId, date} enforces this at the DB level.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/dbConnect";
import { Entry } from "@/models/Entry";
import { getSession, requireSession } from "@/lib/session";
import { fromDateKey, toDateKey } from "@/lib/utils";

const CreateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  mood: z.number().int().min(1).max(5),
  sleepHours: z.number().min(0).max(24).nullable().optional(),
  energyLevel: z.number().int().min(1).max(5).nullable().optional(),
  note: z.string().max(5000).optional(),
});

export async function GET(req: NextRequest) {
  const session = await getSession();
  const unauth = requireSession(session);
  if (unauth) return unauth;

  await dbConnect();

  const { searchParams } = new URL(req.url);
  const fromStr = searchParams.get("from");
  const toStr = searchParams.get("to");

  const filter: any = { userId: session!.id };
  if (fromStr || toStr) {
    filter.date = {};
    if (fromStr) filter.date.$gte = fromDateKey(fromStr);
    if (toStr) filter.date.$lte = fromDateKey(toStr);
  }

  const entries = await Entry.find(filter).sort({ date: -1 }).limit(366).lean();
  return NextResponse.json({ entries });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  const unauth = requireSession(session);
  if (unauth) return unauth;

  const body = await req.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid entry", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  await dbConnect();

  const date = fromDateKey(parsed.data.date);
  const entry = await Entry.findOneAndUpdate(
    { userId: session!.id, date },
    {
      $set: {
        mood: parsed.data.mood,
        sleepHours: parsed.data.sleepHours ?? null,
        energyLevel: parsed.data.energyLevel ?? null,
        note: parsed.data.note ?? null,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

  return NextResponse.json({ entry });
}
