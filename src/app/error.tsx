"use client";

/**
 * Runtime error boundary — shown when a server component or route throws
 * an unhandled error. Designed to match the 404 page for consistency.
 *
 * Must be a client component (Next.js requirement for error boundaries).
 */

import { useEffect } from "react";
import Link from "next/link";
import { Leaf, AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console (in production, send to monitoring service)
    console.error("[app error]", error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-sage-200 dark:bg-sage-900/30 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-sun-100 dark:bg-sun-500/10 blur-3xl" />
      </div>

      <div className="max-w-lg w-full text-center animate-fade-in-up">
        {/* Logo */}
        <Link href="/" className="inline-flex items-center gap-2 mb-8">
          <Leaf className="w-7 h-7 text-sage-500" />
          <span className="font-semibold text-lg">Habit & Mood Tracker</span>
        </Link>

        {/* Warning icon */}
        <div className="inline-flex w-16 h-16 rounded-2xl bg-sun-100 dark:bg-sun-500/10 items-center justify-center mb-6">
          <AlertTriangle className="w-8 h-8 text-sun-600 dark:text-sun-400" />
        </div>

        {/* Experimental badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sage-100 dark:bg-sage-900/50 text-sage-700 dark:text-sage-200 text-xs font-medium mb-4 uppercase tracking-wide">
          <span className="w-1.5 h-1.5 rounded-full bg-sage-500 animate-pulse-soft" />
          Experimental page
        </div>

        {/* Error code */}
        <h1 className="text-5xl md:text-6xl font-bold text-sun-600 dark:text-sun-400 mb-2 tracking-tight">
          Oops
        </h1>

        {/* Main message */}
        <h2 className="text-xl md:text-2xl font-semibold mb-4">
          Something broke on this page
        </h2>

        <div className="space-y-3 text-sm md:text-base text-ink-muted dark:text-sage-300/80 mb-8 max-w-md mx-auto">
          <p>
            The source code for this page was{" "}
            <span className="font-medium text-ink dark:text-bg">deleted by the developer</span>{" "}
            during a recent refactor.
          </p>
          <p>
            We&rsquo;re still trying our best to recover the website. We&rsquo;re
            sorry for the inconvenience.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 justify-center">
          <button onClick={reset} className="btn-primary group">
            <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
            Try again
          </button>
          <Link href="/" className="btn-ghost">
            <ArrowLeft className="w-4 h-4" />
            Back to safety
          </Link>
        </div>

        {/* Footer note */}
        <p className="text-xs text-ink-muted dark:text-sage-300/50 mt-10">
          Built by{" "}
          <a
            href="https://musab-007.netlify.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sage-600 dark:text-sage-300 hover:underline font-medium"
          >
            Musab Projects
          </a>{" "}
          · A project group by Musab Dawood
        </p>
      </div>
    </main>
  );
}
