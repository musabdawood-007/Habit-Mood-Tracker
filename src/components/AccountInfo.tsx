"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Mail, Calendar, AlertTriangle, Trash2, Database, X, Loader2, Check } from "lucide-react";

interface Props {
  user: {
    email: string;
    name: string | null;
    image: string | null;
    authProvider: "google" | "otp" | "both";
    createdAt: string;
    settings: {
      graceDaysPerWeek: number;
      frictionLevel: string;
      theme: string;
    };
  };
  stats: {
    entries: number;
    habits: number;
    habitLogs: number;
  };
}

function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

function MailIcon({ className }: { className?: string }) {
  return <Mail className={className} />;
}

function ProviderBadge({ provider }: { provider: string }) {
  if (provider === "google") {
    return (
      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-bg-dark border border-sage-200 dark:border-sage-800 shadow-sm">
        <GoogleLogo className="w-4 h-4" />
        <span className="text-sm font-medium text-ink dark:text-bg">Signed in with Google</span>
      </span>
    );
  }

  if (provider === "otp") {
    return (
      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sage-100 dark:bg-sage-900/50 border border-sage-200 dark:border-sage-800">
        <MailIcon className="w-4 h-4 text-sage-600 dark:text-sage-300" />
        <span className="text-sm font-medium text-sage-700 dark:text-sage-200">Local account (Email OTP)</span>
      </span>
    );
  }

  // both
  return (
    <div className="flex flex-wrap gap-2">
      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-bg-dark border border-sage-200 dark:border-sage-800 shadow-sm">
        <GoogleLogo className="w-4 h-4" />
        <span className="text-sm font-medium text-ink dark:text-bg">Google</span>
      </span>
      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sage-100 dark:bg-sage-900/50 border border-sage-200 dark:border-sage-800">
        <MailIcon className="w-4 h-4 text-sage-600 dark:text-sage-300" />
        <span className="text-sm font-medium text-sage-700 dark:text-sage-200">Email OTP</span>
      </span>
      <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-sun-100 dark:bg-sun-500/10 text-sun-700 dark:text-sun-400 text-xs font-medium">
        Both methods linked
      </span>
    </div>
  );
}

export default function AccountInfo({ user, stats }: Props) {
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const createdDate = new Date(user.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  async function handleDelete() {
    if (confirmText !== "DELETE") {
      setError("You must type DELETE exactly to confirm");
      return;
    }

    setDeleting(true);
    setError("");
    try {
      const res = await fetch("/api/account/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmText }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || data.message || "Failed to delete account");
      }
      // Sign out + redirect to landing
      await signOut({ callbackUrl: "/", redirect: true });
    } catch (err: any) {
      setError(err.message);
      setDeleting(false);
    }
  }

  return (
    <>
      {/* Profile card */}
      <div className="card">
        <div className="flex items-start gap-4 mb-6">
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.image}
              alt="Profile"
              className="w-16 h-16 rounded-full border-2 border-sage-200 dark:border-sage-800"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-sage-100 dark:bg-sage-900/50 flex items-center justify-center text-2xl font-semibold text-sage-600 dark:text-sage-300">
              {(user.email[0] || "?").toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold truncate">
              {user.name || user.email.split("@")[0]}
            </h2>
            <p className="text-sm text-ink-muted dark:text-sage-300/80 truncate">
              {user.email}
            </p>
            <div className="mt-2">
              <ProviderBadge provider={user.authProvider} />
            </div>
          </div>
        </div>

        {/* Account details */}
        <div className="border-t border-sage-100 dark:border-sage-800/50 pt-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-ink-muted dark:text-sage-300/70">
              <Calendar className="w-4 h-4" />
              Member since
            </span>
            <span className="font-medium">{createdDate}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-ink-muted dark:text-sage-300/70">
              <Mail className="w-4 h-4" />
              Email
            </span>
            <span className="font-medium truncate ml-3">{user.email}</span>
          </div>
        </div>
      </div>

      {/* Your data summary */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-4 h-4 text-sage-500" />
          <h2 className="font-semibold">Your data</h2>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-sage-50 dark:bg-bg-dark/50 p-4 text-center">
            <p className="text-2xl font-bold text-sage-600 dark:text-sage-300">
              {stats.entries}
            </p>
            <p className="text-xs text-ink-muted dark:text-sage-300/70 mt-1">
              Mood {stats.entries === 1 ? "entry" : "entries"}
            </p>
          </div>
          <div className="rounded-xl bg-sage-50 dark:bg-bg-dark/50 p-4 text-center">
            <p className="text-2xl font-bold text-sage-600 dark:text-sage-300">
              {stats.habits}
            </p>
            <p className="text-xs text-ink-muted dark:text-sage-300/70 mt-1">
              {stats.habits === 1 ? "Habit" : "Habits"}
            </p>
          </div>
          <div className="rounded-xl bg-sage-50 dark:bg-bg-dark/50 p-4 text-center">
            <p className="text-2xl font-bold text-sage-600 dark:text-sage-300">
              {stats.habitLogs}
            </p>
            <p className="text-xs text-ink-muted dark:text-sage-300/70 mt-1">
              Habit {stats.habitLogs === 1 ? "log" : "logs"}
            </p>
          </div>
        </div>
        <p className="text-xs text-ink-muted dark:text-sage-300/60 mt-4 text-center">
          Your data stays yours. Export (CSV/PDF) coming in a future update.
        </p>
      </div>

      {/* Preferences summary (links to settings) */}
      <div className="card">
        <h2 className="font-semibold mb-3">Preferences</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-ink-muted dark:text-sage-300/70">Default grace days / week</span>
            <span className="font-medium">{user.settings.graceDaysPerWeek}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-muted dark:text-sage-300/70">Check-in friction</span>
            <span className="font-medium capitalize">{user.settings.frictionLevel}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-muted dark:text-sage-300/70">Theme</span>
            <span className="font-medium capitalize">{user.settings.theme}</span>
          </div>
        </div>
        <button
          onClick={() => router.push("/settings")}
          className="btn-ghost text-sm mt-4 w-full"
        >
          Edit preferences →
        </button>
      </div>

      {/* Danger zone */}
      <div className="card border-sun-200 dark:border-sun-500/30">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-sun-600 dark:text-sun-400" />
          <h2 className="font-semibold text-sun-700 dark:text-sun-400">Danger zone</h2>
        </div>
        <p className="text-sm text-ink-muted dark:text-sage-300/80 mb-4">
          Permanently delete your account and all associated data (entries, habits,
          streaks, insights). This action is irreversible.
        </p>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="btn text-sm w-full bg-sun-500 text-white hover:bg-sun-600"
        >
          <Trash2 className="w-4 h-4" />
          Delete my account
        </button>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in-up"
          onClick={() => !deleting && setShowDeleteModal(false)}
        >
          <div
            className="bg-white dark:bg-bg-dark rounded-2xl max-w-md w-full p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-sun-600 dark:text-sun-400" />
                <h3 className="text-lg font-semibold">Delete account?</h3>
              </div>
              {!deleting && (
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="text-ink-muted hover:text-ink dark:text-sage-300/70 dark:hover:text-bg"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <p className="text-sm text-ink-muted dark:text-sage-300/80 mb-4">
              This will permanently delete:
            </p>
            <ul className="text-sm space-y-1 mb-4 pl-4">
              <li className="list-disc text-ink-muted dark:text-sage-300/70">
                Your account ({user.email})
              </li>
              <li className="list-disc text-ink-muted dark:text-sage-300/70">
                {stats.entries} mood {stats.entries === 1 ? "entry" : "entries"}
              </li>
              <li className="list-disc text-ink-muted dark:text-sage-300/70">
                {stats.habits} {stats.habits === 1 ? "habit" : "habits"} + {stats.habitLogs} logs
              </li>
              <li className="list-disc text-ink-muted dark:text-sage-300/70">
                All streaks, correlations, and AI insights
              </li>
            </ul>

            <p className="text-sm font-medium mb-2">
              Type <span className="font-mono font-bold text-sun-600 dark:text-sun-400">DELETE</span> to confirm:
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              className="input font-mono"
              disabled={deleting}
              autoFocus
            />

            {error && (
              <p className="mt-3 text-sm text-sun-600 bg-sun-50 dark:bg-sun-500/10 p-2 rounded">
                {error}
              </p>
            )}

            <div className="flex gap-2 mt-4">
              <button
                onClick={handleDelete}
                disabled={deleting || confirmText !== "DELETE"}
                className="btn bg-sun-500 text-white hover:bg-sun-600 flex-1 disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Permanently delete
                  </>
                )}
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="btn-ghost"
              >
                Cancel
              </button>
            </div>

            {deleting && (
              <p className="mt-3 text-xs text-ink-muted dark:text-sage-300/70 text-center">
                Do not close this window. Deleting your data...
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
