/**
 * GET /api/seed-templates — one-time route to seed habit templates.
 *
 * Why this exists: running scripts/seed-templates.ts locally requires
 * `npm install` + ts-node + a working MongoDB SRV connection. If your
 * network blocks DNS SRV records (common on some ISPs), this route runs
 * on Vercel's network instead, which has no such restrictions.
 *
 * USAGE:
 *   1. Visit https://YOUR-DOMAIN.vercel.app/api/seed-templates in your browser
 *   2. You should see "Seeded 13 templates."
 *   3. After seeding, this route is harmless to leave in place (idempotent upsert)
 *
 * SECURITY: this route is publicly accessible. Templates are read-only data,
 * so the worst case is someone re-seeds (no-op). Delete this file after seeding
 * if you want to be extra safe.
 */

import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import { HabitTemplate } from "@/models/HabitTemplate";

const templates = [
  // ---- Runner identity ----
  { name: "10-minute walk", identityTag: "runner", description: "Any walk counts — even around the block.", suggestedGraceDays: 1, color: "#7A9C6B" },
  { name: "Stretch for 5 minutes", identityTag: "runner", description: "Post-workout or before bed.", suggestedGraceDays: 2, color: "#7A9C6B" },
  { name: "Run or jog", identityTag: "runner", description: "Any distance, any pace.", suggestedGraceDays: 2, color: "#7A9C6B" },
  // ---- Reader identity ----
  { name: "Read 10 pages", identityTag: "reader", description: "Roughly 10 minutes. Books, articles, anything.", suggestedGraceDays: 2, color: "#B98319" },
  { name: "Read for 15 minutes", identityTag: "reader", description: "Set a timer, no goal beyond time.", suggestedGraceDays: 2, color: "#B98319" },
  // ---- Mindful identity ----
  { name: "Meditate for 5 minutes", identityTag: "mindful", description: "Any style — guided, breath, body scan.", suggestedGraceDays: 3, color: "#9FB893" },
  { name: "Journal one sentence", identityTag: "mindful", description: "Just one sentence about your day.", suggestedGraceDays: 2, color: "#9FB893" },
  { name: "No phone for first 30 min after waking", identityTag: "mindful", description: "Resist the urge to scroll.", suggestedGraceDays: 2, color: "#9FB893" },
  // ---- Healthy identity ----
  { name: "Drink a glass of water", identityTag: "healthy", description: "First thing in the morning.", suggestedGraceDays: 1, color: "#5C7E4D" },
  { name: "Eat a vegetable", identityTag: "healthy", description: "Any vegetable, any portion.", suggestedGraceDays: 1, color: "#5C7E4D" },
  { name: "Sleep before 11pm", identityTag: "healthy", description: "Phone in another room helps.", suggestedGraceDays: 2, color: "#5C7E4D" },
  // ---- Creative identity ----
  { name: "Make something for 10 minutes", identityTag: "creative", description: "Draw, write, code, cook, build — anything creative.", suggestedGraceDays: 2, color: "#E0A526" },
  { name: "Write 3 sentences", identityTag: "creative", description: "Morning pages, journal, fiction — any 3 sentences.", suggestedGraceDays: 2, color: "#E0A526" },
];

export async function GET() {
  try {
    await dbConnect();

    const results: string[] = [];
    for (const t of templates) {
      await HabitTemplate.updateOne(
        { identityTag: t.identityTag, name: t.name },
        { $set: t },
        { upsert: true }
      );
      results.push(`+ ${t.identityTag}: ${t.name}`);
    }

    return NextResponse.json({
      ok: true,
      message: `Seeded ${templates.length} templates.`,
      details: results,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message, stack: err.stack },
      { status: 500 }
    );
  }
}
