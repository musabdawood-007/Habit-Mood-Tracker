/**
 * OTP generation + hashing utilities.
 *
 * - 6-digit numeric code, generated with crypto.randomInt (cryptographically
 *   secure, NOT Math.random).
 * - Hashed with bcrypt before storage — even if the OTP collection is leaked,
 *   the codes can't be reverse-engineered.
 * - Code is returned to the caller ONLY at generation time, so the caller can
 *   email it. It is never retrievable after that.
 */

import bcrypt from "bcryptjs";
import crypto from "crypto";

export function generateOtpCode(): string {
  // 6-digit code, 0-padded. crypto.randomInt(0, 1000000) gives 0..999999.
  const n = crypto.randomInt(0, 1_000_000);
  return n.toString().padStart(6, "0");
}

export async function hashOtp(code: string): Promise<string> {
  // Salt rounds 10 is fine — OTPs are short-lived (10 min), low brute-force risk.
  return bcrypt.hash(code, 10);
}

export async function verifyOtp(code: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(code, hash);
  } catch {
    return false;
  }
}
