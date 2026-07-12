/**
 * GET /api/settings — return current user's settings
 * PATCH /api/settings — update settings (graceDaysPerWeek, frictionLevel, theme, etc.)
 *
 * Settings are stored as an embedded subdoc on the User model — no separate
 * collection needed (always read with the user, denormalized for performance).
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/dbConnect";
import { User } from "@/models/User";
import { getSession, requireSession } from "@/lib/session";

const PatchSchema = z.object({
  graceDaysPerWeek: z.number().int().min(0).max(7).optional(),
  frictionLevel: z.enum(["low", "standard"]).optional(),
  theme: z.enum(["light", "dark", "system"]).optional(),
  notificationTime: z.string().optional(),
  notificationsEnabled: z.boolean().optional(),
});

export async function GET() {
  const session = await getSession();
  const unauth = requireSession(session);
  if (unauth) return unauth;

  await dbConnect();
  const user = await User.findById(session!.id).select("settings").lean();
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ settings: user.settings });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  const unauth = requireSession(session);
  if (unauth) return unauth;

  const body = await req.json();
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid settings", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  await dbConnect();

  // Build $set object with dotted keys for nested settings subdoc
  const setObj: Record<string, any> = {};
  for (const [k, v] of Object.entries(parsed.data)) {
    setObj[`settings.${k}`] = v;
  }

  const user = await User.findByIdAndUpdate(
    session!.id,
    { $set: setObj },
    { new: true }
  ).select("settings");

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ settings: user.settings });
}
