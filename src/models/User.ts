/**
 * User model.
 *
 * Design decisions:
 * - `authProvider` field lets us link Google OAuth and OTP logins to the same
 *   account by email. Without it, a user who logs in via Google then later
 *   tries OTP would create a duplicate account.
 * - `passwordHash` is for the OTP credentials provider — we store a hash of
 *   the OTP only transiently (OTP doc has TTL index, see Otp model). The
 *   `passwordHash` field here is reserved for future "password login" if we
 *   ever add it; currently null for all users.
 * - `settings` is an embedded subdoc rather than a separate collection —
 *   settings are always read with the user, so denormalizing saves a join.
 */

import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUserSettings {
  graceDaysPerWeek: number; // default 1 — ADHD-friendly
  frictionLevel: "low" | "standard"; // low = 3-tap check-in default
  theme: "light" | "dark" | "system";
  notificationTime?: string; // "HH:mm" 24h format
  notificationsEnabled: boolean;
}

export interface IUser extends Document {
  email: string;
  name?: string;
  image?: string;
  authProvider: "google" | "otp" | "both";
  passwordHash?: string | null;
  settings: IUserSettings;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: { type: String, trim: true, default: null },
    image: { type: String, default: null },
    authProvider: {
      type: String,
      enum: ["google", "otp", "both"],
      default: "otp",
    },
    passwordHash: { type: String, default: null },
    settings: {
      graceDaysPerWeek: { type: Number, default: 1, min: 0, max: 7 },
      frictionLevel: {
        type: String,
        enum: ["low", "standard"],
        default: "low",
      },
      theme: { type: String, enum: ["light", "dark", "system"], default: "system" },
      notificationTime: { type: String, default: "20:00" },
      notificationsEnabled: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

// Avoid recompiling model on HMR.
export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
