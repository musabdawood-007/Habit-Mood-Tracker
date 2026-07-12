/**
 * POST /api/otp/request
 * Body: { email: string }
 *
 * Generates a 6-digit OTP, hashes it, stores in DB with 10-min TTL, and emails
 * it to the user. Idempotent — calling again within TTL replaces the old code.
 *
 * Rate limiting: TODO — for production, add per-email rate limit (1 per 60s)
 * to prevent abuse. For dev/demo, no limit.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/dbConnect";
import { Otp } from "@/models/Otp";
import { generateOtpCode, hashOtp } from "@/lib/otp";
import { sendMail } from "@/lib/email";

const BodySchema = z.object({
  email: z.string().email().max(254),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid email", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const email = parsed.data.email.toLowerCase().trim();
    await dbConnect();

    // Invalidate any previous unused OTPs for this email
    await Otp.deleteMany({ email, consumedAt: null });

    const code = generateOtpCode();
    const codeHash = await hashOtp(code);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await Otp.create({
      email,
      codeHash,
      purpose: "login",
      attempts: 0,
      consumedAt: null,
      expiresAt,
    });

    await sendMail({
      to: email,
      subject: "Your Habit & Mood Tracker login code",
      text: `Your login code is: ${code}\n\nIt expires in 10 minutes. If you didn't request this, you can ignore this email.`,
      html: `
        <div style="font-family: -apple-system, system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #1A1A19; margin-bottom: 16px;">Your login code</h2>
          <p style="font-size: 16px; color: #6B6B66;">Use this code to log in to your Habit & Mood Tracker:</p>
          <div style="font-size: 36px; font-weight: 700; letter-spacing: 8px; text-align: center; padding: 24px; background: #F2F5F1; border-radius: 12px; margin: 16px 0; color: #46643A;">
            ${code}
          </div>
          <p style="font-size: 14px; color: #6B6B66;">Expires in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    });

    return NextResponse.json({ ok: true, message: "Code sent" });
  } catch (err: any) {
    console.error("[otp/request] error:", err);
    return NextResponse.json(
      { error: "Failed to send OTP", message: err.message },
      { status: 500 }
    );
  }
}
