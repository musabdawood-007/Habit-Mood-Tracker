/**
 * OTP model — short-lived, single-use login codes.
 *
 * Design:
 * - 6-digit code (not 4 — too easy to brute-force; not 8 — too tedious).
 * - TTL of 10 minutes (auto-deleted by MongoDB TTL index).
 * - `attempts` counter, max 5 — prevents brute-force.
 * - `consumedAt` — once verified, can't be reused.
 * - `purpose` — supports both "login" and (future) "email change" flows.
 */

import mongoose, { Schema, Document, Model } from "mongoose";

export interface IOtp extends Document {
  email: string;
  codeHash: string; // store hash, not the code itself
  purpose: "login" | "email-change";
  attempts: number;
  consumedAt: Date | null;
  expiresAt: Date;
  createdAt: Date;
}

const OtpSchema = new Schema<IOtp>({
  email: { type: String, required: true, lowercase: true, trim: true, index: true },
  codeHash: { type: String, required: true },
  purpose: { type: String, enum: ["login", "email-change"], default: "login" },
  attempts: { type: Number, default: 0, min: 0 },
  consumedAt: { type: Date, default: null },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now, expires: 600 }, // 10 min TTL
});

export const Otp: Model<IOtp> =
  mongoose.models.Otp || mongoose.model<IOtp>("Otp", OtpSchema);
