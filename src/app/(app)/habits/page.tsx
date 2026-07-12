/**
 * Habits management page — list habits, create new ones, link to identities.
 *
 * Server component fetches initial data; client components handle mutations.
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/dbConnect";
import { Habit } from "@/models/Habit";
import { Identity } from "@/models/Identity";
import { HabitTemplate } from "@/models/HabitTemplate";
import HabitsManager from "@/components/HabitsManager";

export default async function HabitsPage() {
  const session = await getServerSession(authOptions);
  await dbConnect();
  const userId = (session?.user as any)?.id;
  if (!userId) return null;

  const [habits, identities, templates] = await Promise.all([
    Habit.find({ userId }).sort({ active: -1, createdAt: 1 }).lean(),
    Identity.find({ userId, active: true }).sort({ name: 1 }).lean(),
    HabitTemplate.find().sort({ identityTag: 1, name: 1 }).lean(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-1">Habits</h1>
        <p className="text-sm text-ink-muted">
          Create habits, link them to identities, configure grace days per habit.
        </p>
      </div>

      <HabitsManager
        habits={habits.map((h) => ({
          _id: h._id.toString(),
          identityId: h.identityId?.toString() || null,
          name: h.name,
          description: h.description || "",
          color: h.color || "#7A9C6B",
          active: h.active,
          graceDaysPerWeek: h.graceDaysPerWeek,
        }))}
        identities={identities.map((i) => ({
          _id: i._id.toString(),
          name: i.name,
          color: i.color || "#5C7E4D",
        }))}
        templates={templates.map((t) => ({
          _id: t._id.toString(),
          name: t.name,
          identityTag: t.identityTag,
          description: t.description,
          suggestedGraceDays: t.suggestedGraceDays,
          color: t.color,
        }))}
      />
    </div>
  );
}
