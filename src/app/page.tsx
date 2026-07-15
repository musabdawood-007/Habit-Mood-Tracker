/**
 * Landing page — explains the app, links to login.
 * Server component (no client interactivity needed).
 */

import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ThemeToggle from "@/components/ThemeToggle";
import { TrendingUp, Sparkles, Shield, Heart, BarChart3, Leaf } from "lucide-react";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  return (
    <main className="min-h-screen flex flex-col">
      <header className="border-b border-sage-100 dark:border-sage-800/50 backdrop-blur-sm bg-white/60 dark:bg-bg-dark/60 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Leaf className="w-6 h-6 text-sage-500" />
            <span className="font-semibold text-lg">Habit & Mood Tracker</span>
          </div>
          <nav className="flex items-center gap-3">
            <ThemeToggle />
            {session ? (
              <Link href="/dashboard" className="btn-primary">
                Go to dashboard →
              </Link>
            ) : (
              <Link href="/login" className="btn-primary">
                Log in
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="flex-1 flex items-center">
        <div className="max-w-5xl mx-auto px-6 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in-up">
              <div className="inline-flex items-center gap-2 pill bg-sage-100 text-sage-700 dark:bg-sage-900/50 dark:text-sage-200 mb-5">
                <Sparkles className="w-3 h-3" />
                <span>Real correlations, not vibes</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-5 leading-[1.1]">
                Track habits.{" "}
                <span className="text-sage-500">Understand</span> your mood.
              </h1>
              <p className="text-lg text-ink-muted dark:text-sage-300 mb-8 max-w-xl">
                Most habit apps show trends. Some claim correlations like
                &ldquo;you slept more on gym days&rdquo; — without telling you the sample
                size or p-value. We do the math properly: real Pearson
                correlation, lag analysis, sample size, and p-value surfaced
                honestly.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/login" className="btn-primary text-base px-6 py-3">
                  Start tracking →
                </Link>
                <a href="#how" className="btn-ghost text-base px-6 py-3">
                  How it works
                </a>
              </div>

              <div className="flex items-center gap-4 mt-8 text-xs text-ink-muted dark:text-sage-300/70">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  Your data stays yours
                </div>
                <div className="flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5" />
                  ADHD-friendly defaults
                </div>
              </div>
            </div>

            {/* Sample mood chart preview */}
            <div className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
              <div className="card-soft relative">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-ink-muted dark:text-sage-300/70 mb-1">
                      Sample preview
                    </p>
                    <p className="font-semibold">Mood trend · 30 days</p>
                  </div>
                  <BarChart3 className="w-5 h-5 text-sage-500" />
                </div>

                {/* Mini chart — pure SVG, no library needed */}
                <svg viewBox="0 0 280 100" className="w-full h-32">
                  <defs>
                    <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#5C7E4D" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#5C7E4D" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {/* Grid lines */}
                  {[20, 40, 60, 80].map((y) => (
                    <line
                      key={y}
                      x1="0"
                      y1={y}
                      x2="280"
                      y2={y}
                      stroke="#E3EAE0"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                    />
                  ))}
                  {/* Area under curve */}
                  <path
                    d="M0,70 L20,60 L40,65 L60,55 L80,50 L100,55 L120,40 L140,45 L160,35 L180,30 L200,40 L220,25 L240,30 L260,20 L280,25 L280,100 L0,100 Z"
                    fill="url(#moodGradient)"
                  />
                  {/* Line */}
                  <path
                    d="M0,70 L20,60 L40,65 L60,55 L80,50 L100,55 L120,40 L140,45 L160,35 L180,30 L200,40 L220,25 L240,30 L260,20 L280,25"
                    fill="none"
                    stroke="#5C7E4D"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Last point */}
                  <circle cx="280" cy="25" r="4" fill="#5C7E4D" />
                  <circle cx="280" cy="25" r="8" fill="#5C7E4D" opacity="0.2" />
                </svg>

                <div className="mt-4 pt-4 border-t border-sage-100 dark:border-sage-800/50">
                  <div className="flex items-center gap-2 text-xs">
                    <TrendingUp className="w-3.5 h-3.5 text-sage-500" />
                    <span className="text-ink-muted dark:text-sage-300/70">
                      &ldquo;Walk outside&rdquo; correlates with mood
                    </span>
                    <span className="pill bg-sage-100 text-sage-700 dark:bg-sage-900/50 dark:text-sage-200 ml-auto">
                      r=0.61, p=0.02
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-16 border-t border-sage-100 dark:border-sage-800/50">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-3">
            Built different, on purpose
          </h2>
          <p className="text-center text-ink-muted dark:text-sage-300 mb-12 max-w-xl mx-auto">
            Three principles that make this not just another habit tracker.
          </p>

          <div className="grid md:grid-cols-3 gap-5">
            <div className="card group hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-sage-100 dark:bg-sage-900/50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-5 h-5 text-sage-600 dark:text-sage-300" />
              </div>
              <h3 className="font-semibold mb-2">Real correlations</h3>
              <p className="text-sm text-ink-muted dark:text-sage-300/80">
                Pearson r, p-value, sample size — all visible. &ldquo;Not enough
                data yet&rdquo; state when n &lt; 10. Never fabricated, never
                hand-waved.
              </p>
            </div>

            <div className="card group hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-sun-100 dark:bg-sun-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Sparkles className="w-5 h-5 text-sun-600 dark:text-sun-500" />
              </div>
              <h3 className="font-semibold mb-2">Identity-based</h3>
              <p className="text-sm text-ink-muted dark:text-sage-300/80">
                Link habits to identities (&ldquo;I am a runner&rdquo;). Track
                identity-consistency %, not just streaks. Missed a day? You
                still showed up.
              </p>
            </div>

            <div className="card group hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-sage-100 dark:bg-sage-900/50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Heart className="w-5 h-5 text-sage-600 dark:text-sage-300" />
              </div>
              <h3 className="font-semibold mb-2">Grace days built in</h3>
              <p className="text-sm text-ink-muted dark:text-sage-300/80">
                ADHD-friendly defaults. Broken streaks are never red, never
                shaming. Grace days per habit, configurable. Life happens.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="py-16 border-t border-sage-100 dark:border-sage-800/50 bg-sage-50/50 dark:bg-bg-dark/30">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-12 text-center">How it works</h2>
          <ol className="space-y-8">
            {[
              {
                step: "1",
                title: "Daily check-in.",
                body: "Three taps: mood, optional sleep, save. Low-friction by design — the hardest part of habit tracking is doing it consistently.",
                emoji: "📊",
              },
              {
                step: "2",
                title: "Track your habits.",
                body: "One-tap completion, or start from a curated template. Grace days mean missing one day doesn't nuke your streak.",
                emoji: "✅",
              },
              {
                step: "3",
                title: "The engine runs.",
                body: "After ~10 days of data, the correlation engine surfaces patterns: \"on days you completed 'walk outside', your mood was 0.8 higher (r=0.61, n=14, p=0.02).\"",
                emoji: "🧮",
              },
              {
                step: "4",
                title: "Claude narrates.",
                body: "A weekly summary grounded in the engine's real numbers — never raw vibes. Always says \"move together,\" never \"caused.\"",
                emoji: "✨",
              },
            ].map(({ step, title, body, emoji }) => (
              <li key={step} className="flex gap-5">
                <div className="shrink-0 w-12 h-12 rounded-full bg-white dark:bg-bg-dark border-2 border-sage-200 dark:border-sage-700 flex items-center justify-center text-xl shadow-sm">
                  {emoji}
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="font-semibold mb-1">
                    <span className="text-ink-muted dark:text-sage-300/70 mr-2">
                      Step {step}.
                    </span>
                    {title}
                  </h3>
                  <p className="text-ink-muted dark:text-sage-300/80 leading-relaxed">
                    {body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 text-center">
        <div className="max-w-xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-4">Ready to start?</h2>
          <p className="text-ink-muted dark:text-sage-300 mb-6">
            Free, open-source, your data stays yours.
          </p>
          <Link href="/login" className="btn-primary text-base px-8 py-3">
            Start tracking →
          </Link>
        </div>
      </section>

      <footer className="border-t border-sage-100 dark:border-sage-800/50 py-8 text-center">
        <p className="text-sm text-ink-muted dark:text-sage-300/70 mb-3">
          Built by{" "}
          <span className="inline-flex items-center gap-2 font-medium text-ink dark:text-bg">
            Musab Projects
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wide bg-sun-100 dark:bg-sun-500/10 text-sun-700 dark:text-sun-400 font-semibold">
              Coming soon
            </span>
          </span>
          {" · "}a project group by Musab Dawood
        </p>
        <a
          href="https://musab-007.netlify.app"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-sage-600 dark:text-sage-300 hover:underline font-medium"
        >
          Learn more
          <span aria-hidden="true">→</span>
        </a>
      </footer>
    </main>
  );
}
