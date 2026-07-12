/**
 * NextAuth.js configuration — Google OAuth + custom OTP credentials provider.
 *
 * Why dual provider (per the v3 brief):
 * - OTP-only means every login is an email round-trip — friction for daily
 *   habit logging, which needs to be fast (the app's own design principle).
 * - Google OAuth gives one-tap login for returning users.
 * - NextAuth supports both providers in the same config, so we don't have to
 *   pick one auth system. The User model's `authProvider` field tracks which
 *   path each user has used; "both" means they've used both.
 *
 * How accounts merge:
 * - Both providers key off email. The OTP provider's `authorize` looks up a
 *   User by email and creates one if none exists. The Google provider does
 *   the same via the `signIn` callback.
 * - Result: a user who logs in via Google then later via OTP lands on the
 *   same account, not a duplicate.
 *
 * NextAuth + Mongoose gotchas:
 * - NextAuth expects a User with `id`, `email`, `name`, `image`. Our Mongoose
 *   User has those fields; the `jwt` and `session` callbacks attach the
 *   Mongoose `_id` as `id` on the session user.
 * - We use JWT sessions (not database sessions) — simpler, works on Vercel
 *   serverless without a DB round-trip on every request.
 */

import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";

import { User } from "@/models/User";
import { Otp } from "@/models/Otp";
import { dbConnect } from "@/lib/dbConnect";
import { verifyOtp } from "@/lib/otp";

const clientPromise = (async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI missing");
  const client = new MongoClient(uri);
  return client.connect();
})();

export const authOptions: NextAuthOptions = {
  // adapter: MongoDBAdapter handles Google OAuth account-linking via the
  // Account + Session collections NextAuth creates. We could skip the adapter
  // and roll our own, but the adapter is battle-tested and saves work.
  adapter: MongoDBAdapter(clientPromise, {
    databaseName: process.env.MONGODB_URI?.split("/").pop()?.split("?")[0] || "habit-mood-tracker",
  }),

  session: {
    strategy: "jwt", // not "database" — serverless-friendly
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),

    CredentialsProvider({
      id: "otp",
      name: "Email OTP",
      credentials: {
        email: { label: "Email", type: "email" },
        code: { label: "OTP Code", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.code) return null;
        await dbConnect();

        const email = credentials.email.toLowerCase().trim();

        // Find the most recent unexpired, unconsumed OTP for this email.
        const otp = await Otp.findOne({
          email,
          purpose: "login",
          consumedAt: null,
          expiresAt: { $gt: new Date() },
        }).sort({ createdAt: -1 });

        if (!otp) return null;

        // Brute-force protection
        if (otp.attempts >= 5) {
          await Otp.deleteOne({ _id: otp._id });
          return null;
        }

        otp.attempts += 1;
        await otp.save();

        const valid = await verifyOtp(credentials.code, otp.codeHash);
        if (!valid) return null;

        // Mark consumed
        otp.consumedAt = new Date();
        await otp.save();

        // Find or create user
        let user = await User.findOne({ email });
        if (!user) {
          user = await User.create({
            email,
            authProvider: "otp",
            settings: {
              graceDaysPerWeek: 1,
              frictionLevel: "low",
              theme: "system",
              notificationsEnabled: false,
            },
          });
        } else if (user.authProvider === "google") {
          user.authProvider = "both";
          await user.save();
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name || undefined,
          image: user.image || undefined,
        };
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        await dbConnect();
        const existing = await User.findOne({ email: user.email.toLowerCase() });
        if (!existing) {
          await User.create({
            email: user.email.toLowerCase(),
            name: user.name || null,
            image: user.image || null,
            authProvider: "google",
            settings: {
              graceDaysPerWeek: 1,
              frictionLevel: "low",
              theme: "system",
              notificationsEnabled: false,
            },
          });
        } else if (existing.authProvider === "otp") {
          existing.authProvider = "both";
          if (!existing.name && user.name) existing.name = user.name;
          if (!existing.image && user.image) existing.image = user.image;
          await existing.save();
        }
      }
      return true;
    },

    async jwt({ token, user, account }) {
      // First sign-in only (user is defined)
      if (user) {
        if (account?.provider === "google") {
          // For Google OAuth: user.id is Google's ID, not our MongoDB _id.
          // Look up our MongoDB user by email and store THAT id.
          await dbConnect();
          const mongoUser = await User.findOne({
            email: (user.email || "").toLowerCase(),
          })
            .select("_id")
            .lean();
          if (mongoUser) {
            token.id = mongoUser._id.toString();
          }
        } else {
          // For OTP credentials provider: authorize() already returns our MongoDB _id
          token.id = (user as any).id;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user && token.id) {
        (session.user as any).id = token.id;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
    // We don't override error pages — NextAuth defaults are fine.
  },
};
