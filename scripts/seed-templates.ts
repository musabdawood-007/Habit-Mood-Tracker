/**
 * Seed script for HabitTemplate collection.
 *
 * Run with: `npm run seed:templates` (or `ts-node scripts/seed-templates.ts`)
 *
 * Idempotent — uses upsert, so running again updates existing templates.
 *
 * These templates solve the cold-start problem: a blank "add your first habit"
 * screen is a bigger drop-off than most developers expect. Curated, grouped by
 * identity tag, one-tap to add. Still fully editable after creation.
 *
 * IMPORTANT: edit this list, don't add a UI for users to create templates —
 * that would open a moderation surface with no upside for a habit app.
 */

import mongoose from "mongoose";
import { HabitTemplate, IHabitTemplate } from "@/models/HabitTemplate";

const templates: Omit<IHabitTemplate, "createdAt" | "_id">[] = [
  // ---- Runner identity ----
  {
    name: "10-minute walk",
    identityTag: "runner",
    description: "Any walk counts — even around the block.",
    suggestedGraceDays: 1,
    color: "#7A9C6B",
  },
  {
    name: "Stretch for 5 minutes",
    identityTag: "runner",
    description: "Post-workout or before bed.",
    suggestedGraceDays: 2,
    color: "#7A9C6B",
  },
  {
    name: "Run or jog",
    identityTag: "runner",
    description: "Any distance, any pace.",
    suggestedGraceDays: 2,
    color: "#7A9C6B",
  },

  // ---- Reader identity ----
  {
    name: "Read 10 pages",
    identityTag: "reader",
    description: "Roughly 10 minutes. Books, articles, anything.",
    suggestedGraceDays: 2,
    color: "#B98319",
  },
  {
    name: "Read for 15 minutes",
    identityTag: "reader",
    description: "Set a timer, no goal beyond time.",
    suggestedGraceDays: 2,
    color: "#B98319",
  },

  // ---- Mindful identity ----
  {
    name: "Meditate for 5 minutes",
    identityTag: "mindful",
    description: "Any style — guided, breath, body scan.",
    suggestedGraceDays: 3,
    color: "#9FB893",
  },
  {
    name: "Journal one sentence",
    identityTag: "mindful",
    description: "Just one sentence about your day.",
    suggestedGraceDays: 2,
    color: "#9FB893",
  },
  {
    name: "No phone for first 30 min after waking",
    identityTag: "mindful",
    description: "Resist the urge to scroll.",
    suggestedGraceDays: 2,
    color: "#9FB893",
  },

  // ---- Healthy identity ----
  {
    name: "Drink a glass of water",
    identityTag: "healthy",
    description: "First thing in the morning.",
    suggestedGraceDays: 1,
    color: "#5C7E4D",
  },
  {
    name: "Eat a vegetable",
    identityTag: "healthy",
    description: "Any vegetable, any portion.",
    suggestedGraceDays: 1,
    color: "#5C7E4D",
  },
  {
    name: "Sleep before 11pm",
    identityTag: "healthy",
    description: "Phone in another room helps.",
    suggestedGraceDays: 2,
    color: "#5C7E4D",
  },

  // ---- Creative identity ----
  {
    name: "Make something for 10 minutes",
    identityTag: "creative",
    description: "Draw, write, code, cook, build — anything creative.",
    suggestedGraceDays: 2,
    color: "#E0A526",
  },
  {
    name: "Write 3 sentences",
    identityTag: "creative",
    description: "Morning pages, journal, fiction — any 3 sentences.",
    suggestedGraceDays: 2,
    color: "#E0A526",
  },
];

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI env var is required.");
    process.exit(1);
  }

  console.log("Connecting to MongoDB…");
  await mongoose.connect(uri);
  console.log("Connected.");

  for (const t of templates) {
    await HabitTemplate.updateOne(
      { identityTag: t.identityTag, name: t.name },
      { $set: t },
      { upsert: true }
    );
    console.log(`  ✓ ${t.identityTag}: ${t.name}`);
  }

  console.log(`\nSeeded ${templates.length} templates.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
