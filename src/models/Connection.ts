/**
 * Connection model — accountability / family connections (Milestone C).
 *
 * This is NOT a shared account — it's opt-in, per-field visibility between
 * two existing accounts. A parent or partner can see your streak and mood
 * trend, not your private notes, unless you explicitly allow it.
 *
 * Permission model:
 * - `permissions` defaults to empty array — everything off until the user
 *   explicitly opts in per field.
 * - Valid permissions: 'viewMood' | 'viewStreaks' | 'viewCorrelations' |
 *   'viewNotes' (notes is OFF by default and should require extra confirm UI).
 * - `status` is 'pending' | 'accepted' | 'rejected' | 'blocked'.
 * - The connection is directional: userId invited connectedUserId. Both sides
 *   keep their own permissions row (asymmetric: I can let you see my streaks
 *   without you letting me see yours).
 *
 * Scope guard: one-to-one or small-group only — accountability partner, not
 * a social network. No feed, no comments, no public profiles.
 */

import mongoose, { Schema, Document, Model } from "mongoose";

export type ConnectionPermission =
  | "viewMood"
  | "viewStreaks"
  | "viewCorrelations"
  | "viewNotes";

export type ConnectionStatus = "pending" | "accepted" | "rejected" | "blocked";

export interface IConnection extends Document {
  userId: mongoose.Types.ObjectId; // the inviter
  connectedUserId: mongoose.Types.ObjectId; // the invitee
  status: ConnectionStatus;
  permissions: ConnectionPermission[]; // what connectedUser can see of userId
  createdAt: Date;
  updatedAt: Date;
  acceptedAt?: Date | null;
}

const ConnectionSchema = new Schema<IConnection>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    connectedUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: { type: String, enum: ["pending", "accepted", "rejected", "blocked"], default: "pending" },
    permissions: {
      type: [String],
      enum: ["viewMood", "viewStreaks", "viewCorrelations", "viewNotes"],
      default: [],
    },
    acceptedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// One directional connection per (userId, connectedUserId) pair.
ConnectionSchema.index({ userId: 1, connectedUserId: 1 }, { unique: true });

export const Connection: Model<IConnection> =
  mongoose.models.Connection ||
  mongoose.model<IConnection>("Connection", ConnectionSchema);
