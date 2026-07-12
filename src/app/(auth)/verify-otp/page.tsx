"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Leaf, ArrowRight, AlertCircle } from "lucide-react";

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="skeleton h-64 w-96" /></div>}>
      <VerifyOtpForm />
    </Suspense>
  );
}

function VerifyOtpForm() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") || "";
  const callbackUrl = params.get("callbackUrl") || "/dashboard";

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [status, setStatus] = useState<"idle" | "verifying" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function handleCodeChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...code];
    next[index] = digit;
    setCode(next);

    // Auto-focus next input
    if (digit && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      (nextInput as HTMLInputElement)?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      (prevInput as HTMLInputElement)?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length > 0) {
      const next = pasted.split("").concat(Array(6 - pasted.length).fill(""));
      setCode(next.slice(0, 6));
      const lastFilled = Math.min(pasted.length, 5);
      document.getElementById(`code-${lastFilled}`)?.focus();
    }
  }

  const fullCode = code.join("");

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setStatus("verifying");
    setErrorMsg("");

    const result = await signIn("otp", {
      email,
      code: fullCode,
      redirect: false,
    });

    if (result?.error) {
      setStatus("error");
      setErrorMsg("Invalid or expired code. Try again or request a new one.");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md animate-fade-in-up">
        <Link href="/" className="block text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-sage-100 dark:bg-sage-900/50 mb-3">
            <Leaf className="w-6 h-6 text-sage-500" />
          </div>
          <h1 className="font-semibold text-xl">Habit & Mood Tracker</h1>
        </Link>

        <div className="card">
          <h2 className="text-2xl font-semibold mb-1">Enter your code</h2>
          <p className="text-sm text-ink-muted dark:text-sage-300/80 mb-6">
            We sent a 6-digit code to <strong>{email}</strong>. It expires in 10 minutes.
          </p>

          <form onSubmit={handleVerify} className="space-y-4">
            <div className="flex gap-2 justify-between" onPaste={handlePaste}>
              {code.map((digit, i) => (
                <input
                  key={i}
                  id={`code-${i}`}
                  type="text"
                  inputMode="numeric"
                  autoComplete={i === 0 ? "one-time-code" : "off"}
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="input text-center text-2xl font-mono w-12 h-14 p-0"
                  disabled={status === "verifying"}
                  autoFocus={i === 0}
                />
              ))}
            </div>

            <button
              type="submit"
              className="btn-primary w-full group"
              disabled={status === "verifying" || fullCode.length !== 6}
            >
              {status === "verifying" ? "Verifying…" : "Verify & log in"}
              {status !== "verifying" && (
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

          <div className="mt-6 pt-4 border-t border-sage-100 dark:border-sage-800/50 text-sm text-ink-muted dark:text-sage-300/70">
            Didn&rsquo;t get it?{" "}
            <Link href="/login" className="text-sage-600 dark:text-sage-300 hover:underline font-medium">
              Try a different email
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
