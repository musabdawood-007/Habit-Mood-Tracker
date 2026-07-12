/**
 * Check-in page — the daily mood log.
 *
 * Low-friction UX (per brief):
 *   - Default flow is 3 taps: pick mood emoji → save. Done.
 *   - Sleep, energy, note are optional, collapsed under "Add details".
 *   - If a check-in exists for today, pre-fill it (edit semantics).
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/dbConnect";
import { Entry } from "@/models/Entry";
import { toDateKey } from "@/lib/utils";
import CheckInForm from "@/components/CheckInForm";

export default async function CheckInPage() {
  const session = await getServerSession(authOptions);
  await dbConnect();
  const userId = (session?.user as any)?.id;
  if (!userId) return null;

  const todayKey = toDateKey(new Date());
  const existing = await Entry.findOne({ userId, date: new Date(todayKey) }).lean();

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-semibold mb-1">Daily check-in</h1>
      <p className="text-sm text-ink-muted mb-6">
        {existing
          ? "Update today's entry."
          : "Three taps. That's it. You can add details if you want."}
      </p>

      <CheckInForm
        todayKey={todayKey}
        initial={existing ? {
          mood: existing.mood,
          sleepHours: existing.sleepHours ?? undefined,
          energyLevel: existing.energyLevel ?? undefined,
          note: existing.note ?? undefined,
        } : undefined}
      />
    </div>
  );
}
