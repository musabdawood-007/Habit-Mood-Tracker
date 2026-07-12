"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Leaf, LogOut, Settings as SettingsIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import ThemeToggle from "@/components/ThemeToggle";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/check-in", label: "Check-in", icon: "📝" },
  { href: "/habits", label: "Habits", icon: "🎯" },
  { href: "/account", label: "Account", icon: "👤" },
];

export default function AppNav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-sage-100 dark:border-sage-800/50 bg-white/80 dark:bg-bg-dark/80 backdrop-blur-md sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 md:gap-6">
          <Link href="/dashboard" className="flex items-center gap-1.5 shrink-0">
            <Leaf className="w-5 h-5 text-sage-500" />
            <span className="font-semibold hidden sm:inline">Habit & Mood</span>
          </Link>
          <nav className="flex gap-0.5">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-2 md:px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5",
                  pathname === item.href
                    ? "bg-sage-100 text-sage-700 dark:bg-sage-900/50 dark:text-sage-200"
                    : "text-ink-muted hover:bg-sage-50 hover:text-ink dark:text-sage-300/70 dark:hover:bg-bg-dark/50 dark:hover:text-bg"
                )}
              >
                <span className="sm:hidden">{item.icon}</span>
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <ThemeToggle />
          <Link
            href="/settings"
            className={cn(
              "btn-ghost text-sm px-2 md:px-3 py-1.5",
              pathname === "/settings" && "bg-sage-100 dark:bg-sage-900/50"
            )}
            aria-label="Settings"
            title="Settings"
          >
            <SettingsIcon className="w-4 h-4" />
            <span className="hidden md:inline">Settings</span>
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="btn-ghost text-sm px-2 md:px-3 py-1.5"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden md:inline">Sign out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
