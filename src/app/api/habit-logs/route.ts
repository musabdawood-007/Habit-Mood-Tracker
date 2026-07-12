/**
 * GET /api/habit-logs?from=YYYY-MM-DD&to=YYYY-MM-DD
 *   Returns all logs for the current user in the date range.
 *   Useful for the dashboard heatmap and streak calc.
 *
 * POST /api/habit-logs
 *   Body: { habitId, date, completed }
 *   Upsert: toggle a habit completion for a date. Idempotent.
 *   Verifies the habit belongs to the user before upserting.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/dbConnect";
import { HabitLog } from "@/models/HabitLog";
import { Habit } from "@/models/Habit";
import { getSession, requireSession } from "@/lib/session";
import { fromDateKey } from "@/lib/utils";

const UpsertSchema = z.object({
  habitId: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  completed: z.boolean(),
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

  const logs = await HabitLog.find(filter).sort({ date: -1 }).lean();
  return NextResponse.json({ logs });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  const unauth = requireSession(session);
  if (unauth) return unauth;

  const body = await req.json();
  const parsed = UpsertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  await dbConnect();

  // Verify the habit belongs to the user
  const habit = await Habit.findOne({
    _id: parsed.data.habitId,
    userId: session!.id,
  }).lean();
  if (!habit) {
    return NextResponse.json({ error: "Habit not found" }, { status: 404 });
  }

  const date = fromDateKey(parsed.data.date);
  const log = await HabitLog.findOneAndUpdate(
    { habitId: parsed.data.habitId, date },
    {
      $set: {
        completed: parsed.data.completed,
        userId: session!.id,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

  return NextResponse.json({ log });
}
