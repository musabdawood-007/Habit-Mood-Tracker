/**
 * PATCH /api/habits/[id] — update habit (name, description, color, active, graceDays)
 * DELETE /api/habits/[id] — soft-delete (set active=false). Hard delete would orphan logs.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/dbConnect";
import { Habit } from "@/models/Habit";
import { getSession, requireSession } from "@/lib/session";

const UpdateSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  description: z.string().max(280).optional(),
  color: z.string().optional(),
  active: z.boolean().optional(),
  graceDaysPerWeek: z.number().int().min(0).max(7).optional(),
  identityId: z.string().nullable().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  const unauth = requireSession(session);
  if (unauth) return unauth;

  const body = await req.json();
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid update", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  await dbConnect();
  const habit = await Habit.findOneAndUpdate(
    { _id: params.id, userId: session!.id },
    { $set: parsed.data },
    { new: true }
  ).lean();

  if (!habit) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ habit });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  const unauth = requireSession(session);
  if (unauth) return unauth;

  await dbConnect();
  const result = await Habit.updateOne(
    { _id: params.id, userId: session!.id },
    { $set: { active: false } }
  );
  if (result.matchedCount === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
