/**
 * PushSubscription model — Web Push API subscriptions (Milestone C).
 *
 * One user can have multiple subscriptions (phone, laptop, desktop) — we send
 * to all of them. Cleanup happens via periodic purging of expired subs.
 */

import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPushSubscription extends Document {
  userId: mongoose.Types.ObjectId;
  endpoint: string; // unique URL from push service (FCM, Mozilla, Apple)
  subscriptionObject: object; // full subscription JSON for web-push lib
  createdAt: Date;
}

const PushSubscriptionSchema = new Schema<IPushSubscription>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  endpoint: { type: String, required: true, unique: true },
  subscriptionObject: { type: Schema.Types.Mixed, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const PushSubscription: Model<IPushSubscription> =
  mongoose.models.PushSubscription ||
  mongoose.model<IPushSubscription>("PushSubscription", PushSubscriptionSchema);
