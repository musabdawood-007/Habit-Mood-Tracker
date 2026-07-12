/**
 * NextAuth route handler.
 *
 * Files in `app/api/auth/[...nextauth]/route.ts` catch all auth-related
 * routes (/api/auth/signin, /api/auth/callback/*, /api/auth/session, etc.).
 *
 * Gotcha: must export both GET and POST from the same NextAuth handler.
 */
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
