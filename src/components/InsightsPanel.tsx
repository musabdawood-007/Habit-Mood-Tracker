"use client";

import { useState, useEffect } from "react";
import { Sparkles, RefreshCw, AlertCircle, Clock, TrendingUp } from "lucide-react";

interface InsightData {
  _id: string;
  content: string;
  modelUsed: string;
  correlationsUsed: number;
  generatedAt: string;
  latencyMs?: number;
}

export default function InsightsPanel() {
  const [insight, setInsight] = useState<InsightData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/insights/weekly")
      .then((r) => r.json())
      .then((data) => setInsight(data.insight || null))
      .catch(() => setError("Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  async function handleGenerate() {
    setGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/insights/weekly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || data.error || "Failed");
      }
      const data = await res.json();
      setInsight(data.insight);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  const generatedDate = insight
    ? new Date(insight.generatedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div className="card-soft">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-sun-500" />
          <h2 className="font-semibold">Weekly insight</h2>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="btn-secondary text-xs"
        >
          <RefreshCw className={`w-3 h-3 ${generating ? "animate-spin" : ""}`} />
          {generating ? "Generating…" : insight ? "Refresh" : "Generate"}
        </button>
      </div>

      {loading && (
        <div className="space-y-2">
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-5/6" />
          <div className="skeleton h-4 w-3/4" />
        </div>
      )}

      {!loading && error && (
        <div className="flex items-start gap-2 text-sm text-sun-600 bg-sun-50 dark:bg-sun-500/10 p-3 rounded-lg">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && insight && (
        <div className="animate-fade-in-up">
          <p className="text-ink dark:text-bg leading-relaxed">{insight.content}</p>
          <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-sage-200 dark:border-sage-800/50 text-xs text-ink-muted dark:text-sage-300/70">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {generatedDate}
            </span>
            {insight.correlationsUsed > 0 && (
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Based on {insight.correlationsUsed} correlation{insight.correlationsUsed !== 1 ? "s" : ""}
              </span>
            )}
            {insight.modelUsed !== "none" && (
              <span className="pill bg-sage-100 dark:bg-sage-900/50 text-sage-700 dark:text-sage-200">
                {insight.modelUsed}
              </span>
            )}
          </div>
        </div>
      )}

      {!loading && !error && !insight && (
        <div className="py-6 text-center">
          <div className="inline-flex w-12 h-12 rounded-xl bg-sun-100 dark:bg-sun-500/10 items-center justify-center mb-3">
            <Sparkles className="w-5 h-5 text-sun-500" />
          </div>
          <p className="text-sm text-ink-muted dark:text-sage-300/80 mb-3">
            No insight generated yet.
          </p>
          <p className="text-xs text-ink-muted dark:text-sage-300/60 mb-4 max-w-sm">
            Click Generate to analyze your correlations and write a 3-sentence summary.
            Takes ~25 seconds. Cached for 7 days.
          </p>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="btn-primary text-sm"
          >
            <Sparkles className="w-4 h-4" />
            Generate weekly insight
          </button>
        </div>
      )}
    </div>
  );
}
