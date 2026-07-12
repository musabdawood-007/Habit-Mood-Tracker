/**
 * GET /api/habits — list habits for the current user (optionally ?include=inactive)
 * POST /api/habits — create a habit
 *
 * Defaults new habit's graceDaysPerWeek from user.settings if not specified.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/dbConnect";
import { Habit } from "@/models/Habit";
import { User } from "@/models/User";
import { getSession, requireSession } from "@/lib/session";

const CreateSchema = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().max(280).optional(),
  identityId: z.string().optional(),
  graceDaysPerWeek: z.number().int().min(0).max(7).optional(),
  color: z.string().optional(),
  templateId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getSession();
  const unauth = requireSession(session);
  if (unauth) return unauth;

  await dbConnect();

  const { searchParams } = new URL(req.url);
  const includeInactive = searchParams.get("include") === "inactive";

  const filter: any = { userId: session!.id };
  if (!includeInactive) filter.active = true;

  const habits = await Habit.find(filter).sort({ createdAt: 1 }).lean();
  return NextResponse.json({ habits });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  const unauth = requireSession(session);
  if (unauth) return unauth;

  const body = await req.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid habit", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  await dbConnect();

  // Default grace days from user settings if not specified
  let graceDays = parsed.data.graceDaysPerWeek;
  if (graceDays === undefined) {
    const user = await User.findById(session!.id).lean();
    graceDays = user?.settings?.graceDaysPerWeek ?? 1;
  }

  try {
    const habit = await Habit.create({
      userId: session!.id,
      identityId: parsed.data.identityId || null,
      name: parsed.data.name,
      description: parsed.data.description || null,
      color: parsed.data.color || "#7A9C6B",
      active: true,
      graceDaysPerWeek: graceDays,
      templateId: parsed.data.templateId || null,
    });
    return NextResponse.json({ habit }, { status: 201 });
  } catch (err: any) {
    if (err.code === 11000) {
      return NextResponse.json(
        { error: "You already have a habit with this name." },
        { status: 409 }
      );
    }
    throw err;
  }
}
