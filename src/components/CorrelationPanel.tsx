"use client";

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, AlertTriangle, RefreshCw } from "lucide-react";
import { describeR, describeP } from "@/lib/stats";

interface CorrelationData {
  _id: string;
  habitId: string;
  targetMetric: "mood" | "energy" | "sleep";
  lagDays: 0 | 1 | 2;
  r: number;
  pValue: number;
  n: number;
  confounderWarning: boolean;
  computedAt: string;
}

interface Props {
  habitNames: Record<string, string>;
}

const METRIC_LABELS: Record<string, string> = {
  mood: "mood",
  energy: "energy",
  sleep: "sleep hours",
};

function lagLabel(lag: number): string {
  if (lag === 0) return "same day";
  if (lag === 1) return "next day";
  return "2 days later";
}

export default function CorrelationPanel({ habitNames }: Props) {
  const [correlations, setCorrelations] = useState<CorrelationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [recomputing, setRecomputing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/correlations")
      .then((r) => r.json())
      .then((data) => setCorrelations(data.correlations || []))
      .catch(() => setError("Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  async function handleRecompute() {
    setRecomputing(true);
    setError("");
    try {
      const res = await fetch("/api/correlations", { method: "POST" });
      if (!res.ok) throw new Error("Recompute failed");
      const data = await res.json();
      // Reload to get fresh correlations
      const res2 = await fetch("/api/correlations");
      const data2 = await res2.json();
      setCorrelations(data2.correlations || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRecomputing(false);
    }
  }

  // Filter to correlations with n >= 10 (UI rule from brief)
  const meaningful = correlations.filter((c) => c.n >= 10);
  const significant = meaningful.filter((c) => c.pValue < 0.05);
  const positive = significant.filter((c) => c.r > 0).sort((a, b) => b.r - a.r);
  const negative = significant.filter((c) => c.r < 0).sort((a, b) => a.r - b.r);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-sage-500" />
          <h2 className="font-semibold">Why is my mood moving?</h2>
        </div>
        <button
          onClick={handleRecompute}
          disabled={recomputing}
          className="btn-ghost text-xs"
          title="Recompute correlations from latest data"
        >
          <RefreshCw className={`w-3 h-3 ${recomputing ? "animate-spin" : ""}`} />
          {recomputing ? "Computing…" : "Recompute"}
        </button>
      </div>

      {loading && (
        <div className="space-y-2">
          <div className="skeleton h-12 w-full" />
          <div className="skeleton h-12 w-full" />
        </div>
      )}

      {!loading && error && (
        <p className="text-sm text-sun-600">{error}</p>
      )}

      {!loading && !error && meaningful.length === 0 && (
        <div className="py-6 text-center">
          <p className="text-sm text-ink-muted dark:text-sage-300/80 mb-2">
            Not enough data yet.
          </p>
          <p className="text-xs text-ink-muted dark:text-sage-300/60 max-w-sm mx-auto">
            You need at least 10 days of mood entries + habit logs before
            correlations can be computed meaningfully. Keep logging daily.
          </p>
        </div>
      )}

      {!loading && !error && meaningful.length > 0 && (
        <div className="space-y-4">
          {positive.length > 0 && (
            <div>
              <p className="text-xs font-medium text-sage-700 dark:text-sage-300 uppercase tracking-wide mb-2 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Habits that move with HIGHER {Object.values(METRIC_LABELS)[0]}
              </p>
              <ul className="space-y-2">
                {positive.slice(0, 3).map((c) => (
                  <CorrelationRow key={c._id} c={c} habitName={habitNames[c.habitId] || "Unknown"} />
                ))}
              </ul>
            </div>
          )}

          {negative.length > 0 && (
            <div>
              <p className="text-xs font-medium text-sun-700 dark:text-sun-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                <TrendingDown className="w-3 h-3" />
                Habits that move with LOWER metrics
              </p>
              <ul className="space-y-2">
                {negative.slice(0, 3).map((c) => (
                  <CorrelationRow key={c._id} c={c} habitName={habitNames[c.habitId] || "Unknown"} />
                ))}
              </ul>
            </div>
          )}

          {significant.length === 0 && meaningful.length > 0 && (
            <p className="text-sm text-ink-muted dark:text-sage-300/70 py-3">
              You have {meaningful.length} correlation{meaningful.length !== 1 ? "s" : ""} computed, but none
              are statistically significant yet. Keep logging — patterns emerge with more data.
            </p>
          )}
        </div>
      )}

      {!loading && !error && meaningful.length > 0 && (
        <p className="text-xs text-ink-muted dark:text-sage-300/60 mt-4 pt-3 border-t border-sage-100 dark:border-sage-800/50">
          Correlation ≠ causation. These show what moves together in your data,
          not what causes what.
        </p>
      )}
    </div>
  );
}

function CorrelationRow({ c, habitName }: { c: CorrelationData; habitName: string }) {
  return (
    <li className="flex items-start gap-3 p-3 rounded-lg bg-sage-50 dark:bg-bg-dark/50">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm truncate">{habitName}</span>
          {c.confounderWarning && (
            <AlertTriangle
              className="w-3.5 h-3.5 text-sun-500 shrink-0"
              aria-label="Confounder warning — this habit co-occurs with another, effects may be entangled"
            />
          )}
        </div>
        <p className="text-xs text-ink-muted dark:text-sage-300/70">
          {lagLabel(c.lagDays)} · {METRIC_LABELS[c.targetMetric]}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="font-mono text-sm font-semibold">
          r={c.r.toFixed(2)}
        </p>
        <p className="text-xs text-ink-muted dark:text-sage-300/70">
          n={c.n} · p={c.pValue.toFixed(3)}
        </p>
      </div>
    </li>
  );
}
