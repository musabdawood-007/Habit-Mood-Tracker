/**
 * DELETE /api/account/delete
 *
 * Permanently deletes the user's account AND all associated data:
 * - User document
 * - All entries (mood logs)
 * - All habits + habit logs
 * - All identities
 * - All correlations
 * - All insights
 * - All OTP codes (cleanup)
 * - All push subscriptions
 *
 * This is irreversible. The frontend shows a confirmation modal with typing
 * the word "DELETE" before this endpoint is called.
 *
 * After deletion, the NextAuth session is invalidated client-side via
 * signOut() in the UI.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/dbConnect";
import { getSession, requireSession } from "@/lib/session";
import { User } from "@/models/User";
import { Entry } from "@/models/Entry";
import { Habit } from "@/models/Habit";
import { HabitLog } from "@/models/HabitLog";
import { Identity } from "@/models/Identity";
import { Correlation } from "@/models/Correlation";
import { Insight } from "@/models/Insight";
import { Otp } from "@/models/Otp";
import { PushSubscription } from "@/models/PushSubscription";
import mongoose from "mongoose";

const BodySchema = z.object({
  confirmText: z.literal("DELETE"),
});

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  const unauth = requireSession(session);
  if (unauth) return unauth;

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Body required with confirmText: 'DELETE'" },
      { status: 400 }
    );
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "You must type DELETE to confirm" },
      { status: 400 }
    );
  }

  await dbConnect();
  const userId = new mongoose.Types.ObjectId(session!.id);

  // Use a transaction to ensure all-or-nothing deletion
  const session_db = await mongoose.startSession();
  try {
    await session_db.withTransaction(async () => {
      // Delete in dependency order (children first, parent last)

      // 1. All mood entries
      await Entry.deleteMany({ userId }).session(session_db);

      // 2. All habit logs (must come before habits)
      await HabitLog.deleteMany({ userId }).session(session_db);

      // 3. All habits
      await Habit.deleteMany({ userId }).session(session_db);

      // 4. All identities
      await Identity.deleteMany({ userId }).session(session_db);

      // 5. All cached correlations
      await Correlation.deleteMany({ userId }).session(session_db);

      // 6. All AI insights
      await Insight.deleteMany({ userId }).session(session_db);

      // 7. Any OTP codes for this user's email
      const user = await User.findById(userId).lean().session(session_db);
      if (user) {
        await Otp.deleteMany({ email: user.email }).session(session_db);
      }

      // 8. Push subscriptions
      await PushSubscription.deleteMany({ userId }).session(session_db);

      // 9. Finally, the user
      await User.deleteOne({ _id: userId }).session(session_db);
    });
  } catch (err: any) {
    console.error("[account/delete] error:", err);
    return NextResponse.json(
      { error: "Failed to delete account", message: err.message },
      { status: 500 }
    );
  } finally {
    await session_db.endSession();
  }

  return NextResponse.json({
    ok: true,
    message: "Account and all associated data permanently deleted.",
  });
}
