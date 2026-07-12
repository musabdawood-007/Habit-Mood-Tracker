/**
 * Identity model — Atomic Habits style.
 *
 * An Identity is "who you want to become" (runner, reader, someone who sleeps
 * well). Habits link to identities. The dashboard shows identity-consistency %
 * (of last 30 days, what fraction had at least one habit completed for that
 * identity) instead of just raw streak counts.
 */

import mongoose, { Schema, Document, Model } from "mongoose";

export interface IIdentity extends Document {
  userId: mongoose.Types.ObjectId;
  name: string; // "runner", "reader"
  color?: string; // optional — for UI badges
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const IdentitySchema = new Schema<IIdentity>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 60 },
    color: { type: String, default: "#5C7E4D" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// One user can't have two identities with the same name.
IdentitySchema.index({ userId: 1, name: 1 }, { unique: true });

export const Identity: Model<IIdentity> =
  mongoose.models.Identity || mongoose.model<IIdentity>("Identity", IdentitySchema);
