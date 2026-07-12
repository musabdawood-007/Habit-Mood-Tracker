"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch — theme is only known client-side
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-9 h-9" />;

  const options = [
    { value: "light", icon: Sun, label: "Light" },
    { value: "system", icon: Monitor, label: "System" },
    { value: "dark", icon: Moon, label: "Dark" },
  ] as const;

  return (
    <div className="inline-flex items-center gap-0.5 rounded-lg border border-sage-200 dark:border-sage-800 p-0.5 bg-white dark:bg-bg-dark">
      {options.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          aria-label={label}
          title={label}
          className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${
            theme === value
              ? "bg-sage-100 dark:bg-sage-800 text-sage-700 dark:text-sage-200"
              : "text-ink-muted hover:text-ink dark:hover:text-bg"
          }`}
        >
          <Icon className="w-3.5 h-3.5" />
        </button>
      ))}
    </div>
  );
}
