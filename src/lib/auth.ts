/**
 * NextAuth.js configuration — Google OAuth + custom OTP credentials provider.
 *
 * ARCHITECTURE (fixed):
 * - NO MongoDBAdapter — we use JWT sessions, not database sessions, so the
 *   adapter is unnecessary AND causes conflicts with our custom signIn
 *   callback (both try to create the user, with different schemas).
 * - User creation happens ONLY in our callbacks (signIn for Google, authorize
 *   for OTP), using Mongoose — so schema defaults (settings, graceDays, etc.)
 *   are properly applied.
 * - JWT token carries MongoDB _id, exposed on session.user.id.
 */

import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

import { User } from "@/models/User";
import { Otp } from "@/models/Otp";
import { dbConnect } from "@/lib/dbConnect";
import { verifyOtp } from "@/lib/otp";

export const authOptions: NextAuthOptions = {
  // NO adapter — JWT sessions only. We handle user creation in callbacks.
  session: {
    strategy: "jwt",
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

        const otp = await Otp.findOne({
          email,
          purpose: "login",
          consumedAt: null,
          expiresAt: { $gt: new Date() },
        }).sort({ createdAt: -1 });

        if (!otp) return null;

        if (otp.attempts >= 5) {
          await Otp.deleteOne({ _id: otp._id });
          return null;
        }

        otp.attempts += 1;
        await otp.save();

        const valid = await verifyOtp(credentials.code, otp.codeHash);
        if (!valid) return null;

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
      // For Google OAuth: ensure user exists in our MongoDB
      if (account?.provider === "google" && user.email) {
        await dbConnect();
        const email = user.email.toLowerCase();
        const existing = await User.findOne({ email });
        if (!existing) {
          await User.create({
            email,
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
      // First sign-in only (user object is defined)
      if (user) {
        if (account?.provider === "google") {
          // Google OAuth: user.id is Google's ID, not MongoDB _id.
          // Look up our MongoDB user by email and store THAT id.
          await dbConnect();
          const mongoUser = await User.findOne({
            email: (user.email || "").toLowerCase(),
          })
            .select("_id")
            .lean();
          if (mongoUser) {
            token.id = mongoUser._id.toString();
          } else {
            // Fallback: create user if somehow missing (shouldn't happen
            // because signIn callback runs first, but defensive)
            const newUser = await User.create({
              email: (user.email || "").toLowerCase(),
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
            token.id = newUser._id.toString();
          }
        } else {
          // OTP credentials provider: authorize() already returns MongoDB _id
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
  },
};
