"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Plus, LayoutTemplate, Sparkles, Trash2, Archive, RotateCcw } from "lucide-react";

interface Habit {
  _id: string;
  identityId: string | null;
  name: string;
  description?: string;
  color: string;
  active: boolean;
  graceDaysPerWeek: number;
}

interface Identity {
  _id: string;
  name: string;
  color: string;
}

interface Template {
  _id: string;
  name: string;
  identityTag: string;
  description: string;
  suggestedGraceDays: number;
  color: string;
}

interface Props {
  habits: Habit[];
  identities: Identity[];
  templates: Template[];
}

const COLORS = ["#7A9C6B", "#5C7E4D", "#E0A526", "#9FB893", "#B98319", "#46643A"];
const TAG_EMOJIS: Record<string, string> = {
  runner: "🏃",
  reader: "📚",
  mindful: "🧘",
  healthy: "🥗",
  creative: "🎨",
};

export default function HabitsManager({ habits: initialHabits, identities, templates }: Props) {
  const router = useRouter();
  const [habits, setHabits] = useState<Habit[]>(initialHabits);
  const [showCreate, setShowCreate] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showIdentityForm, setShowIdentityForm] = useState(false);
  const [localIdentities, setLocalIdentities] = useState<Identity[]>(identities);

  // New habit form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [identityId, setIdentityId] = useState<string>("");
  const [graceDays, setGraceDays] = useState(1);
  const [color, setColor] = useState(COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // New identity form state
  const [identityName, setIdentityName] = useState("");

  async function createHabit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || undefined,
          identityId: identityId || undefined,
          graceDaysPerWeek: graceDays,
          color,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create habit");
      }
      const { habit } = await res.json();
      setHabits([...habits, { ...habit, _id: habit._id.toString() }]);
      setName("");
      setDescription("");
      setIdentityId("");
      setGraceDays(1);
      setColor(COLORS[0]);
      setShowCreate(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function createHabitFromTemplate(t: Template) {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: t.name,
          description: t.description,
          graceDaysPerWeek: t.suggestedGraceDays,
          color: t.color,
          templateId: t._id,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed");
      }
      const { habit } = await res.json();
      setHabits([...habits, { ...habit, _id: habit._id.toString() }]);
      setShowTemplates(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function createIdentity(e: React.FormEvent) {
    e.preventDefault();
    if (!identityName.trim()) return;
    try {
      const res = await fetch("/api/identities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: identityName }),
      });
      if (!res.ok) throw new Error("Failed");
      const { identity } = await res.json();
      setLocalIdentities([...localIdentities, { ...identity, _id: identity._id.toString() }]);
      setIdentityName("");
      setShowIdentityForm(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function toggleActive(habit: Habit) {
    const newActive = !habit.active;
    setHabits(habits.map((h) => (h._id === habit._id ? { ...h, active: newActive } : h)));
    await fetch(`/api/habits/${habit._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: newActive }),
    });
    router.refresh();
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {error && (
        <div className="text-sm text-sun-600 bg-sun-50 dark:bg-sun-500/10 p-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Identities */}
      <section className="card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sage-500" />
            <h2 className="font-semibold">Identities</h2>
          </div>
          <button
            onClick={() => setShowIdentityForm(!showIdentityForm)}
            className="btn-ghost text-sm"
          >
            <Plus className="w-4 h-4" />
            New identity
          </button>
        </div>

        {showIdentityForm && (
          <form onSubmit={createIdentity} className="flex gap-2 mb-4 animate-fade-in-up">
            <input
              value={identityName}
              onChange={(e) => setIdentityName(e.target.value)}
              placeholder="e.g., runner, reader, mindful person"
              className="input flex-1"
              maxLength={60}
              autoFocus
            />
            <button type="submit" className="btn-primary">
              Add
            </button>
          </form>
        )}

        {localIdentities.length === 0 ? (
          <p className="text-sm text-ink-muted dark:text-sage-300/80">
            Identities are &ldquo;who you want to become.&rdquo; Link habits to them to track
            identity-consistency, not just streaks.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {localIdentities.map((i) => (
              <span
                key={i._id}
                className="pill"
                style={{
                  backgroundColor: `${i.color}20`,
                  color: i.color,
                }}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: i.color }} />
                {i.name}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Habits list */}
      <section className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Your habits</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="btn-ghost text-sm"
            >
              <LayoutTemplate className="w-4 h-4" />
              From template
            </button>
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="btn-primary text-sm"
            >
              <Plus className="w-4 h-4" />
              New habit
            </button>
          </div>
        </div>

        {/* Templates */}
        {showTemplates && (
          <div className="mb-4 p-4 rounded-xl bg-sage-50 dark:bg-bg-dark/50 animate-fade-in-up">
            <p className="text-sm font-medium mb-3">Pick a starter habit:</p>
            <div className="grid sm:grid-cols-2 gap-2">
              {templates.map((t) => (
                <button
                  key={t._id}
                  onClick={() => createHabitFromTemplate(t)}
                  disabled={saving}
                  className="text-left p-3 rounded-lg border border-sage-200 dark:border-sage-800 hover:border-sage-400 dark:hover:border-sage-600 hover:shadow-sm transition-all disabled:opacity-50"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">{TAG_EMOJIS[t.identityTag] || "✨"}</span>
                    <span className="font-medium text-sm flex-1">{t.name}</span>
                  </div>
                  {t.description && (
                    <p className="text-xs text-ink-muted dark:text-sage-300/70 mb-1">
                      {t.description}
                    </p>
                  )}
                  <p className="text-[10px] text-ink-muted dark:text-sage-300/50 uppercase tracking-wide">
                    #{t.identityTag} · {t.suggestedGraceDays} grace/wk
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Create form */}
        {showCreate && (
          <form onSubmit={createHabit} className="mb-4 p-4 rounded-xl bg-sage-50 dark:bg-bg-dark/50 space-y-3 animate-fade-in-up">
            <div>
              <label className="label">Habit name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., 10-minute walk"
                className="input"
                maxLength={80}
                required
                autoFocus
              />
            </div>
            <div>
              <label className="label">Description (optional)</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Any walk, even short ones count"
                className="input"
                maxLength={280}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Link to identity (optional)</label>
                <select
                  value={identityId}
                  onChange={(e) => setIdentityId(e.target.value)}
                  className="input"
                >
                  <option value="">— None —</option>
                  {localIdentities.map((i) => (
                    <option key={i._id} value={i._id}>
                      {i.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Grace days / week</label>
                <select
                  value={graceDays}
                  onChange={(e) => setGraceDays(Number(e.target.value))}
                  className="input"
                >
                  {[0, 1, 2, 3].map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 0 ? "(strict)" : n === 1 ? "(default)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="label">Color</label>
              <div className="flex gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-transform",
                      color === c ? "border-ink dark:border-bg scale-110" : "border-transparent"
                    )}
                    style={{ backgroundColor: c }}
                    aria-label={`Color ${c}`}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? "Creating…" : "Create habit"}
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="btn-ghost"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Habits list */}
        {habits.length === 0 ? (
          <div className="py-10 text-center">
            <div className="inline-flex w-12 h-12 rounded-xl bg-sage-100 dark:bg-sage-900/50 items-center justify-center mb-3">
              <Plus className="w-5 h-5 text-sage-500" />
            </div>
            <p className="text-sm text-ink-muted dark:text-sage-300/80 mb-3">
              No habits yet. Create one or pick from templates.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-sage-100 dark:divide-sage-800/50">
            {habits.map((habit) => (
              <li key={habit._id} className="py-3 flex items-center gap-3">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: habit.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "font-medium text-sm",
                    !habit.active && "line-through text-ink-muted dark:text-sage-300/50"
                  )}>
                    {habit.name}
                  </p>
                  {habit.description && (
                    <p className="text-xs text-ink-muted dark:text-sage-300/70 truncate">
                      {habit.description}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-xs text-ink-muted dark:text-sage-300/70">
                      {habit.graceDaysPerWeek} grace{habit.graceDaysPerWeek !== 1 ? "s" : ""}/wk
                    </span>
                    {habit.identityId && (
                      <>
                        <span className="text-xs text-ink-muted dark:text-sage-300/50">·</span>
                        <span
                          className="pill text-[10px]"
                          style={{
                            backgroundColor: `${
                              localIdentities.find((i) => i._id === habit.identityId)?.color || "#5C7E4D"
                            }20`,
                            color: localIdentities.find((i) => i._id === habit.identityId)?.color || "#5C7E4D",
                          }}
                        >
                          {localIdentities.find((i) => i._id === habit.identityId)?.name || "—"}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => toggleActive(habit)}
                  className={cn(
                    "text-xs px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1",
                    habit.active
                      ? "bg-sage-100 text-sage-700 hover:bg-sage-200 dark:bg-sage-900/50 dark:text-sage-200"
                      : "bg-sage-50 text-ink-muted hover:bg-sage-100 dark:bg-bg-dark dark:text-sage-300/70"
                  )}
                  title={habit.active ? "Archive this habit" : "Reactivate this habit"}
                >
                  {habit.active ? (
                    <>
                      <Archive className="w-3 h-3" />
                      <span className="hidden sm:inline">Archive</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-3 h-3" />
                      <span className="hidden sm:inline">Reactivate</span>
                    </>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
