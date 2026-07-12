/**
 * GET /api/habit-templates?identityTag=runner — list templates (optionally filtered)
 *
 * Templates are seeded, read-only for users. See scripts/seed-templates.ts.
 */
import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import { HabitTemplate } from "@/models/HabitTemplate";

export async function GET(req: NextRequest) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const tag = searchParams.get("identityTag");

  const filter: any = {};
  if (tag) filter.identityTag = tag.toLowerCase();

  const templates = await HabitTemplate.find(filter).sort({ identityTag: 1, name: 1 }).lean();
  return NextResponse.json({ templates });
}
