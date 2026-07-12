/**
 * Session utility — wrapper around NextAuth's getServerSession.
 *
 * Why wrap: every protected API route needs the same boilerplate
 * (dbConnect + getServerSession + 401 check). Centralizing it keeps route
 * handlers thin and makes it easy to swap session strategy later.
 */

import { getServerSession } from "next-auth";
import { NextAuthOptions } from "next-auth";
import { authOptions } from "@/lib/auth";

export type SessionUser = {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
};

export async function getSession(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  return {
    id: (session.user as any).id,
    email: session.user.email,
    name: session.user.name,
    image: session.user.image,
  };
}

export function requireSession(session: SessionUser | null): Response | null {
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return null;
}

export { authOptions };
