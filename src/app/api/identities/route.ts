/**
 * GET /api/identities — list identities for the current user
 * POST /api/identities — create an identity
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/dbConnect";
import { Identity } from "@/models/Identity";
import { getSession, requireSession } from "@/lib/session";

const CreateSchema = z.object({
  name: z.string().trim().min(1).max(60),
  color: z.string().optional(),
});

export async function GET() {
  const session = await getSession();
  const unauth = requireSession(session);
  if (unauth) return unauth;

  await dbConnect();
  const identities = await Identity.find({
    userId: session!.id,
    active: true,
  })
    .sort({ createdAt: 1 })
    .lean();
  return NextResponse.json({ identities });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  const unauth = requireSession(session);
  if (unauth) return unauth;

  const body = await req.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid identity", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  await dbConnect();
  try {
    const identity = await Identity.create({
      userId: session!.id,
      name: parsed.data.name,
      color: parsed.data.color || "#5C7E4D",
      active: true,
    });
    return NextResponse.json({ identity }, { status: 201 });
  } catch (err: any) {
    if (err.code === 11000) {
      return NextResponse.json(
        { error: "You already have an identity with this name." },
        { status: 409 }
      );
    }
    throw err;
  }
}
