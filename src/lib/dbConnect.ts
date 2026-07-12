/**
 * MongoDB connection utility (singleton pattern).
 *
 * Why singleton: Next.js dev mode hot-reloads modules, which would otherwise
 * spawn a new Mongoose connection on every reload and exhaust the connection
 * pool. Caching on `globalThis` survives HMR.
 *
 * Why Mongoose over native driver: the brief explicitly asks for schema/ODM,
 * which Mongoose provides. Native driver would be marginally faster but loses
 * schema validation, which matters for a data-integrity-sensitive app (entries
 * must have mood in 1-5, dates must be unique per user, etc.).
 */

import mongoose, { Mongoose } from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error(
    "MONGODB_URI is not defined. Copy .env.example to .env.local and fill it in."
  );
}

// Augment globalThis to cache the connection across HMR cycles.
interface MongooseCache {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

const globalCache = global as unknown as { mongoose?: MongooseCache };
if (!globalCache.mongoose) {
  globalCache.mongoose = { conn: null, promise: null };
}
const cached = globalCache.mongoose;

export async function dbConnect(): Promise<Mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      maxPoolSize: 10, // Atlas free tier allows ~100 concurrent; 10 is safe
    };
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((m) => m);
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}
