"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Leaf, Mail, ArrowRight, AlertCircle } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="skeleton h-64 w-96" /></div>}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleOtpRequest(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");
    try {
      const res = await fetch("/api/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send code");
      }
      setStatus("sent");
      router.push(`/verify-otp?email=${encodeURIComponent(email)}&callbackUrl=${encodeURIComponent(callbackUrl)}`);
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err.message);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md animate-fade-in-up">
        <Link href="/" className="block text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-sage-100 dark:bg-sage-900/50 mb-3">
            <Leaf className="w-6 h-6 text-sage-500" />
          </div>
          <h1 className="font-semibold text-xl">Habit & Mood Tracker</h1>
        </Link>

        <div className="card">
          <h2 className="text-2xl font-semibold mb-1">Welcome back</h2>
          <p className="text-sm text-ink-muted dark:text-sage-300/80 mb-6">
            Log in to continue your check-ins.
          </p>

          <button
            onClick={() => signIn("google", { callbackUrl })}
            className="btn-secondary w-full mb-4"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-sage-200 dark:border-sage-800" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white dark:bg-bg-dark px-2 text-sm text-ink-muted dark:text-sage-300/70">
                or
              </span>
            </div>
          </div>

          <form onSubmit={handleOtpRequest} className="space-y-4">
            <div>
              <label htmlFor="email" className="label">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted dark:text-sage-300/70" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input pl-10"
                  disabled={status === "sending"}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary w-full group"
              disabled={status === "sending" || !email}
            >
              {status === "sending" ? "Sending code…" : "Send login code"}
              {status !== "sending" && (
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              )}
            </button>
          </form>

          {status === "error" && (
            <div className="mt-4 flex items-start gap-2 text-sm text-sun-600 bg-sun-50 dark:bg-sun-500/10 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {status === "sent" && (
            <p className="mt-4 text-sm text-sage-600 dark:text-sage-300">
              Code sent! Check your email.
            </p>
          )}
        </div>

        <p className="text-xs text-center text-ink-muted dark:text-sage-300/70 mt-6">
          By continuing, you agree to track your own data honestly.
        </p>
        <p className="text-xs text-center text-ink-muted dark:text-sage-300/50 mt-3">
          Built by{" "}
          <a
            href="https://musab-007.netlify.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sage-600 dark:text-sage-300 hover:underline"
          >
            Musab Projects
          </a>{" "}
          · Musab Dawood
        </p>
      </div>
    </main>
  );
}
