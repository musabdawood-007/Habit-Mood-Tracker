/**
 * GET /api/health — DB + service health check.
 *
 * Used by the build order (step 1) to verify MongoDB connection works.
 */
import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import mongoose from "mongoose";

export async function GET() {
  try {
    await dbConnect();
    const dbState = mongoose.connection.readyState;
    // 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
    const stateName = ["disconnected", "connected", "connecting", "disconnecting"][dbState] || "unknown";

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      db: stateName,
      env: process.env.NODE_ENV || "development",
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        status: "error",
        message: err.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
