/**
 * Account page — view user info, see auth provider, delete account.
 *
 * Server component fetches the user document; passes to a client component
 * for the deletion modal (which requires interactivity).
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/dbConnect";
import { User } from "@/models/User";
import { Entry } from "@/models/Entry";
import { Habit } from "@/models/Habit";
import { HabitLog } from "@/models/HabitLog";
import AccountInfo from "@/components/AccountInfo";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  await dbConnect();
  const userId = (session?.user as any)?.id;
  if (!userId) return null;

  const user = await User.findById(userId).lean();
  if (!user) return null;

  // Stats for the user — show how much data they have
  const [entryCount, habitCount, habitLogCount] = await Promise.all([
    Entry.countDocuments({ userId }),
    Habit.countDocuments({ userId }),
    HabitLog.countDocuments({ userId }),
  ]);

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Account</h1>
        <p className="text-sm text-ink-muted dark:text-sage-300/80">
          Your account info, sign-in method, and data management.
        </p>
      </div>

      <AccountInfo
        user={{
          email: user.email,
          name: user.name || null,
          image: user.image || null,
          authProvider: user.authProvider,
          createdAt: user.createdAt.toISOString(),
          settings: {
            graceDaysPerWeek: user.settings.graceDaysPerWeek,
            frictionLevel: user.settings.frictionLevel,
            theme: user.settings.theme,
          },
        }}
        stats={{
          entries: entryCount,
          habits: habitCount,
          habitLogs: habitLogCount,
        }}
      />
    </div>
  );
}
