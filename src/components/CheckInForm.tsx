"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { moodToEmoji, moodToLabel } from "@/lib/utils";
import { ArrowRight, Moon, Zap, StickyNote, ChevronDown, ChevronUp } from "lucide-react";

interface Initial {
  mood: number;
  sleepHours?: number;
  energyLevel?: number;
  note?: string;
}

interface Props {
  todayKey: string;
  initial?: Initial;
}

const MOODS = [1, 2, 3, 4, 5];

export default function CheckInForm({ todayKey, initial }: Props) {
  const router = useRouter();
  const [mood, setMood] = useState<number>(initial?.mood ?? 3);
  const [sleepHours, setSleepHours] = useState<string>(
    initial?.sleepHours?.toString() ?? ""
  );
  const [energyLevel, setEnergyLevel] = useState<number | null>(
    initial?.energyLevel ?? null
  );
  const [note, setNote] = useState<string>(initial?.note ?? "");
  const [showDetails, setShowDetails] = useState<boolean>(
    Boolean(initial?.sleepHours || initial?.energyLevel || initial?.note)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>("");

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: todayKey,
          mood,
          sleepHours: sleepHours ? parseFloat(sleepHours) : null,
          energyLevel: energyLevel ?? null,
          note: note.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card space-y-6 animate-fade-in-up">
      {/* Mood selector — large tap targets */}
      <div>
        <label className="label text-base">How do you feel?</label>
        <div className="grid grid-cols-5 gap-2 md:gap-3">
          {MOODS.map((m) => (
            <button
              key={m}
              type="button"
              data-selected={mood === m}
              onClick={() => setMood(m)}
              className="mood-btn"
            >
              <span className="text-4xl md:text-5xl transition-transform group-hover:scale-110">
                {moodToEmoji(m)}
              </span>
              <span className="text-[10px] md:text-xs text-ink-muted dark:text-sage-300/70 font-medium">
                {moodToLabel(m)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Optional details */}
      <div>
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-1.5 text-sm text-sage-600 dark:text-sage-300 hover:underline font-medium"
        >
          {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {showDetails ? "Hide details" : "Add details (sleep, energy, note)"}
        </button>

        {showDetails && (
          <div className="mt-4 space-y-4 animate-fade-in-up">
            <div>
              <label htmlFor="sleep" className="label flex items-center gap-1.5">
                <Moon className="w-3.5 h-3.5" />
                Sleep (hours) — optional
              </label>
              <input
                id="sleep"
                type="number"
                step="0.25"
                min="0"
                max="24"
                value={sleepHours}
                onChange={(e) => setSleepHours(e.target.value)}
                placeholder="e.g., 7.5"
                className="input"
              />
            </div>

            <div>
              <label className="label flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                Energy — optional
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEnergyLevel(energyLevel === e ? null : e)}
                    className={`flex-1 py-2.5 rounded-md text-sm font-medium border-2 transition-all ${
                      energyLevel === e
                        ? "border-sage-500 bg-sage-50 dark:bg-sage-900/50 text-sage-700 dark:text-sage-200 scale-105"
                        : "border-sage-100 dark:border-sage-800 text-ink-muted dark:text-sage-300/70 hover:border-sage-300 dark:hover:border-sage-700"
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="note" className="label flex items-center gap-1.5">
                <StickyNote className="w-3.5 h-3.5" />
                Note — optional
              </label>
              <textarea
                id="note"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What happened today? Anything on your mind?"
                className="input resize-none"
                maxLength={5000}
              />
              <p className="text-xs text-ink-muted dark:text-sage-300/70 mt-1 text-right">
                {note.length}/5000
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="text-sm text-sun-600 bg-sun-50 dark:bg-sun-500/10 p-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex-1 group"
        >
          {saving ? "Saving…" : initial ? "Update entry" : "Save check-in"}
          {!saving && (
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          )}
        </button>
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="btn-ghost"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
