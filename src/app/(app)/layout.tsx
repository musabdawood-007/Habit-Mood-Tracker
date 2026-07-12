/**
 * Authenticated app layout — sidebar nav, requires session.
 * Server component: redirects to /login if no session.
 */
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AppNav from "@/components/AppNav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login?callbackUrl=/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AppNav />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 md:px-6 py-6 md:py-10">
        {children}
      </main>
      <footer className="border-t border-sage-100 dark:border-sage-800/50 py-4 text-center text-xs text-ink-muted dark:text-sage-300/70">
        Built by{" "}
        <a
          href="https://musab-007.netlify.app"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sage-600 dark:text-sage-300 hover:underline font-medium"
        >
          Musab Projects
        </a>{" "}
        · A project group by Musab Dawood · Your data stays yours
      </footer>
    </div>
  );
}
