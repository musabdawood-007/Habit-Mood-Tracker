/**
 * GET /api/streaks/[habitId] — current + longest streak for a habit
 *
 * Returns grace-day-aware streak using the algorithm in lib/streaks.ts.
 */
import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import { Habit } from "@/models/Habit";
import { calculateStreak } from "@/lib/streaks";
import { getSession, requireSession } from "@/lib/session";

export async function GET(
  _req: NextRequest,
  { params }: { params: { habitId: string } }
) {
  const session = await getSession();
  const unauth = requireSession(session);
  if (unauth) return unauth;

  await dbConnect();

  const habit = await Habit.findOne({
    _id: params.habitId,
    userId: session!.id,
  }).lean();
  if (!habit) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const streak = await calculateStreak(
    habit._id.toString(),
    habit.graceDaysPerWeek
  );

  return NextResponse.json({
    habitId: habit._id,
    name: habit.name,
    graceDaysPerWeek: habit.graceDaysPerWeek,
    streak,
  });
}
