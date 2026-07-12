"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor, Save, Check } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [graceDays, setGraceDays] = useState(1);
  const [frictionLevel, setFrictionLevel] = useState<"low" | "standard">("low");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.settings) {
          setGraceDays(data.settings.graceDaysPerWeek);
          setFrictionLevel(data.settings.frictionLevel);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          graceDaysPerWeek: graceDays,
          frictionLevel,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const themeOptions = [
    { value: "light", icon: Sun, label: "Light" },
    { value: "system", icon: Monitor, label: "System" },
    { value: "dark", icon: Moon, label: "Dark" },
  ] as const;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Settings</h1>
        <p className="text-sm text-ink-muted dark:text-sage-300/80">
          Customize how the app behaves for you.
        </p>
      </div>

      {/* Theme */}
      <div className="card">
        <h2 className="font-semibold mb-1">Appearance</h2>
        <p className="text-sm text-ink-muted dark:text-sage-300/80 mb-4">
          Choose how the app looks. System matches your device.
        </p>
        {mounted && (
          <div className="grid grid-cols-3 gap-2">
            {themeOptions.map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  theme === value
                    ? "border-sage-500 bg-sage-50 dark:bg-sage-900/50"
                    : "border-sage-100 dark:border-sage-800/50 hover:border-sage-300 dark:hover:border-sage-700"
                }`}
              >
                <Icon className={`w-5 h-5 ${theme === value ? "text-sage-600 dark:text-sage-300" : "text-ink-muted dark:text-sage-300/70"}`} />
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Defaults */}
      <div className="card">
        <h2 className="font-semibold mb-1">Habit defaults</h2>
        <p className="text-sm text-ink-muted dark:text-sage-300/80 mb-4">
          These apply to new habits you create. Existing habits keep their own settings.
        </p>

        {loading ? (
          <div className="space-y-3">
            <div className="skeleton h-10 w-full" />
            <div className="skeleton h-10 w-full" />
          </div>
        ) : (
          <>
            <div className="mb-4">
              <label className="label">Default grace days per week</label>
              <p className="text-xs text-ink-muted dark:text-sage-300/70 mb-2">
                How many missed days per week don&rsquo;t break a streak. ADHD-friendly default is 1.
              </p>
              <div className="flex gap-2">
                {[0, 1, 2, 3].map((n) => (
                  <button
                    key={n}
                    onClick={() => setGraceDays(n)}
                    className={`flex-1 py-2.5 rounded-md text-sm font-medium border-2 transition-all ${
                      graceDays === n
                        ? "border-sage-500 bg-sage-50 dark:bg-sage-900/50 text-sage-700 dark:text-sage-200"
                        : "border-sage-100 dark:border-sage-800 text-ink-muted dark:text-sage-300/70 hover:border-sage-300 dark:hover:border-sage-700"
                    }`}
                  >
                    {n} {n === 0 && "(strict)"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Check-in friction</label>
              <p className="text-xs text-ink-muted dark:text-sage-300/70 mb-2">
                Low = 3-tap default. Standard = show all fields expanded.
              </p>
              <div className="flex gap-2">
                {(["low", "standard"] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => setFrictionLevel(level)}
                    className={`flex-1 py-2.5 rounded-md text-sm font-medium border-2 transition-all capitalize ${
                      frictionLevel === level
                        ? "border-sage-500 bg-sage-50 dark:bg-sage-900/50 text-sage-700 dark:text-sage-200"
                        : "border-sage-100 dark:border-sage-800 text-ink-muted dark:text-sage-300/70 hover:border-sage-300 dark:hover:border-sage-700"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Save bar */}
      <div className="flex items-center gap-3 sticky bottom-4">
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="btn-primary group"
        >
          {saving ? (
            "Saving…"
          ) : saved ? (
            <>
              <Check className="w-4 h-4" />
              Saved
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save changes
            </>
          )}
        </button>
      </div>
    </div>
  );
}
