# Habit & Mood Tracker

> **Built by [Musab Projects](https://musab-007.netlify.app)** — a project group by Musab Dawood

A personal-data platform for tracking habits and mood, surfacing real statistical correlations, and reframing habit psychology around identities (not shame-streaks). Built with Next.js + MongoDB + AI insights.

> **Status**: Milestone A complete (scaffold, auth, CRUD, dashboard). Milestone B (correlation engine) complete. Milestone C (AI weekly insights via bynara router, push, export) — AI shipped, push/export stubbed.

---

## Quick start

```bash
# 1. Install deps
npm install

# 2. Copy env file and fill in real values
cp .env.example .env.local
# Edit .env.local — see "Credentials you need" below

# 3. Run the dev server
npm run dev

# 4. (Optional) Seed habit templates
npm run seed:templates
```

Open http://localhost:3000 — you should see the landing page.

Verify the DB connection works:
```bash
curl http://localhost:3000/api/health
# → { "status": "ok", "db": "connected", ... }
```

---

## Credentials you need (and how to get them)

### 1. MongoDB Atlas connection string

1. Create a free account at https://www.mongodb.com/cloud/atlas/register
2. Create a free **M0** cluster (512MB — plenty for personal use)
3. Under **Database Access**, create a user with read/write perms
4. Under **Network Access**, allow your IP (or `0.0.0.0/0` for anywhere — less secure)
5. Click **Connect → Drivers → Node.js** → copy the connection string
6. Replace `<password>` with your DB user's password
7. Paste as `MONGODB_URI` in `.env.local`

Format:
```
mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/habit-mood-tracker?retryWrites=true&w=majority
```

### 2. NextAuth secret

Generate a random 32+ char string:
```bash
openssl rand -base64 32
```
Set as `NEXTAUTH_SECRET` in `.env.local`.

For local dev, set `NEXTAUTH_URL=http://localhost:3000`.
For Vercel prod, set `NEXTAUTH_URL=https://your-domain.vercel.app`.

### 3. Google OAuth (for the "Continue with Google" button)

1. Go to https://console.cloud.google.com/apis/credentials
2. Create a project (or use existing)
3. **Configure consent screen** → External → fill in app name + your email
4. **Create Credentials → OAuth client ID** → Web application
5. Add **Authorized redirect URIs**:
   - `http://localhost:3000/api/auth/callback/google` (dev)
   - `https://YOUR-DOMAIN/api/auth/callback/google` (prod)
6. Copy the **Client ID** and **Client Secret** into `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`

### 4. SMTP (for OTP email login)

You have three options. Pick one based on stage:

#### Option A — Gmail App Password (zero cost, dev only)
1. Enable **2-Step Verification** on your Google account: https://myaccount.google.com/security
2. Go to **App passwords** (search if hidden)
3. Choose "Mail" + custom name "HabitMoodTracker"
4. Google gives you a **16-character password** like `abcd efgh ijkl mnop`
5. Set in `.env.local`:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your.email@gmail.com
   SMTP_PASS=abcd efgh ijkl mnop
   SMTP_FROM=your.email@gmail.com
   ```
   ⚠ Gmail caps at ~100 emails/day — fine for dev, bad for production.

#### Option B — Resend (recommended for production, free tier 3,000/mo)
1. Sign up at https://resend.com
2. Verify your domain (or use their `on.resend.com` sandbox)
3. Get your API key
4. Set:
   ```
   SMTP_HOST=smtp.resend.com
   SMTP_PORT=465
   SMTP_USER=resend
   SMTP_PASS=your_resend_api_key
   SMTP_FROM=you@yourdomain.com
   ```

#### Option C — Outlook / Yahoo (similar to Gmail, just different host)
- Outlook: `smtp.office365.com:587`
- Yahoo: `smtp.mail.yahoo.com:587`

If you skip SMTP entirely, the app still runs — emails get logged to the server console (useful for local dev to see OTP codes without a real inbox).

### 5. Anthropic API key (Milestone C — Claude weekly insights)

1. Get a key from https://console.anthropic.com/
2. Set as `ANTHROPIC_API_KEY` in `.env.local`
3. Only needed once you reach the Claude stretch goal — core app works without it.

### 6. Web Push VAPID keys (Milestone C — browser notifications)

```bash
npx web-push generate-vapid-keys
```
Set the public + private keys as `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT`. Only needed for the push-notifications stretch goal.

---

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router) | Per brief — Vercel-native, server components |
| Language | TypeScript 5 (strict) | Type safety for a data-integrity-sensitive app |
| DB | MongoDB + Mongoose | Per brief — flexible schema, Atlas free tier |
| Auth | NextAuth.js v4 | Google OAuth + custom OTP credentials provider, same config |
| Charts | Recharts | Per brief — React-native, simple |
| Stats | simple-statistics + jstat | Pearson r + t-distribution → p-value |
| Email | Nodemailer | Provider-agnostic via SMTP env vars |
| Styling | Tailwind CSS 3 | Custom calm/sage palette — no harsh reds for streak breaks |
| Deployment | Vercel | Per brief |

---

## Project structure

```
src/
├── app/
│   ├── (auth)/                  # Auth-only routes (no app nav)
│   │   ├── login/page.tsx       # Google + OTP request
│   │   └── verify-otp/page.tsx  # 6-digit code entry
│   ├── (app)/                   # Authenticated routes (with AppNav)
│   │   ├── layout.tsx           # Session guard, sidebar
│   │   ├── dashboard/page.tsx   # Mood chart, identity %, habits today, streaks, heatmap
│   │   ├── check-in/page.tsx    # 3-tap daily mood log
│   │   └── habits/page.tsx      # CRUD habits + identities + templates
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── otp/request/route.ts
│   │   ├── health/route.ts
│   │   ├── entries/route.ts     # GET list, POST upsert
│   │   ├── entries/[id]/route.ts
│   │   ├── habits/route.ts
│   │   ├── habits/[id]/route.ts
│   │   ├── habit-logs/route.ts  # GET list, POST upsert (toggle)
│   │   ├── identities/route.ts
│   │   ├── identities/[id]/route.ts
│   │   ├── habit-templates/route.ts
│   │   ├── streaks/[habitId]/route.ts
│   │   └── correlations/route.ts  # GET cached, POST recompute (Milestone B)
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                 # Landing page
├── components/
│   ├── AppNav.tsx
│   ├── CheckInForm.tsx          # 3-tap low-friction form
│   ├── HabitToggleList.tsx      # One-tap complete on dashboard
│   ├── HabitsManager.tsx        # Full CRUD UI
│   ├── HeatmapCalendar.tsx      # GitHub-style 90-day heatmap
│   └── MoodTrendChart.tsx       # Recharts line chart
├── lib/
│   ├── auth.ts                  # NextAuth config (Google + OTP)
│   ├── dbConnect.ts             # Mongoose singleton
│   ├── email.ts                 # Nodemailer transporter
│   ├── otp.ts                   # Generate + hash OTP
│   ├── session.ts               # getServerSession wrapper
│   ├── stats.ts                 # Pearson r + p-value + confounder check
│   ├── streaks.ts               # Grace-day-aware streak algorithm
│   └── utils.ts                 # cn(), date helpers, mood→emoji
└── models/
    ├── User.ts
    ├── Identity.ts
    ├── Entry.ts
    ├── Habit.ts
    ├── HabitLog.ts
    ├── HabitTemplate.ts
    ├── Correlation.ts
    ├── Connection.ts            # Milestone C — accountability connections
    ├── PushSubscription.ts      # Milestone C — web push
    ├── Otp.ts                   # TTL-indexed OTP codes
    └── index.ts                 # re-exports

scripts/
├── seed-templates.ts            # Seed HabitTemplate collection
└── tsconfig.json
```

---

## Build order (per brief, three milestones)

### Milestone A — Core app ✅ (this deliverable)

- ✅ Project scaffold + `/api/health` verification
- ✅ Auth: NextAuth with Google OAuth + OTP credentials provider
- ✅ Entry CRUD (low-friction 3-tap check-in)
- ✅ Habit CRUD + Identity model + linking
- ✅ Habit Templates (seeded) + "add from template" UI
- ✅ Streak logic with grace days (7-day trailing window algorithm)
- ✅ Dashboard v1: mood trend chart, habit completion %, heatmap, identity-consistency panel

### Milestone B — Differentiator (structure in place, needs cron trigger)

- ✅ Correlation engine API: `/api/correlations/recompute` — Pearson r via `simple-statistics`, p-value via `jstat` t-distribution, n tracked, confounder co-occurrence check
- ⏳ Correlation UI panel (TODO — wire to dashboard)
- ⏳ Mood → Habit Prescription (TODO — uses correlation data)

**To activate**: add a Vercel Cron job that hits `/api/correlations/recompute` nightly, OR add a "Recompute now" button on the dashboard.

### Milestone C — Platform features (stubbed for next iteration)

- ⏸ Family/Accountability Connections (model exists, no UI)
- ⏸ Browser Push Notifications (model exists, no service worker)
- ⏸ Export: CSV + PDF (`papaparse` + `jspdf` in deps, no endpoints)
- ⏸ Claude weekly insights (`@anthropic-ai/sdk` in deps, no endpoint)

---

## Architecture decisions worth knowing

### Why MongoDB over Prisma/SQLite
The brief explicitly required MongoDB. Prisma is excellent but the brief's author wants Atlas + Mongoose for flexibility with subdocuments (settings, permissions arrays). The `Correlation` cache collection is the one place we denormalize for performance.

### Why NextAuth JWT sessions (not database sessions)
Database sessions cost a DB round-trip on every request. JWT sessions are stateless — better for Vercel serverless. Trade-off: revoking sessions requires rotating `NEXTAUTH_SECRET`. Acceptable for a personal app.

### Why OTP is a credentials provider (not a separate auth system)
NextAuth lets you compose providers. By making OTP a `CredentialsProvider`, both Google and OTP share the same session/JWT system, the same callback flow, and the same User model. No bespoke session handling.

### Why streaks use grace days (and the algorithm)
See `src/lib/streaks.ts` for the full algorithm. Short version: walk backward from today, track missed days in a trailing 7-day window, only break the streak when missed count exceeds the habit's `graceDaysPerWeek`. This prevents "I missed one day, my 47-day streak is gone" demoralization — a known drop-off cause in habit apps, especially for ADHD users.

### Why correlations are cached, not computed live
The engine iterates `habits × metrics × lags` (e.g., 5 habits × 3 metrics × 3 lags = 45 correlations), each scanning the user's full entry history. Doing this on every dashboard load would be wasteful. We cache to the `Correlation` collection and recompute via cron or manual button.

### Why we display p-value, not just r
A correlation of r=0.8 with n=4 is meaningless (could be pure chance). The same r with n=50 is strong evidence. Showing p (and n) next to r makes the user an informed consumer of their own data — the opposite of how Daylio/Reflectly present "patterns."

### Why we never say "caused"
Correlation ≠ causation. Even with lag-1/2 analysis, there could be confounders (e.g., "coffee" and "good mood" might both be caused by "had a free morning"). The UI copy and code comments always say "move together," never "causes." The `confounderWarning` flag in the Correlation model surfaces cases where two habits co-occur too often to separate.

---

## Deployment to Vercel (full guide)

### ⚠️ CRITICAL: never commit `.env.local` to GitHub

Your `.env.local` contains:
- MongoDB password
- SMTP app password (Gmail)
- bynara API key (paid)
- NextAuth secret

**These must NEVER be in the repo.** The `.gitignore` already excludes `.env.local` (and `.env`, `.env.*.local`) — verify with:
```bash
git status   # .env.local should NOT appear in "untracked files"
```

If you accidentally commit secrets, **rotate them immediately**:
- MongoDB: change password in Atlas → update Vercel env vars
- SMTP: revoke + regenerate Gmail App Password
- bynara: rotate key in their dashboard
- NextAuth: regenerate with `openssl rand -base64 32`

### Step-by-step deploy

1. **Initialize git + push to GitHub**
   ```bash
   cd habit-mood-tracker
   git init
   git add .
   git commit -m "Initial commit — Habit & Mood Tracker by Musab Projects"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/habit-mood-tracker.git
   git push -u origin main
   ```

2. **Import to Vercel**
   - Go to https://vercel.com/new
   - Import the GitHub repo
   - Vercel auto-detects Next.js (no config needed — `vercel.json` is included)

3. **Add environment variables in Vercel**
   - In the Vercel project dashboard → **Settings → Environment Variables**
   - Add each variable from `.env.example` with your **production** values:
     - `MONGODB_URI` — same Atlas connection string (consider creating a separate prod DB user)
     - `NEXTAUTH_SECRET` — generate a new one with `openssl rand -base64 32` (don't reuse dev)
     - `NEXTAUTH_URL` — `https://YOUR-APP.vercel.app` (your Vercel domain)
     - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `SMTP_FROM_NAME`
     - `AI_API_BASE`, `AI_API_KEY`, `AI_MODEL`
     - Mark each as **Production** (and **Preview** if you want preview deployments to work)
   - Click **Deploy**

4. **Update Google OAuth redirect URIs** (if using Google login)
   - Go to https://console.cloud.google.com/apis/credentials
   - Edit your OAuth client
   - Add `https://YOUR-APP.vercel.app/api/auth/callback/google` to authorized redirect URIs

5. **Seed habit templates to prod DB**
   - Locally, temporarily set `MONGODB_URI` to your prod Atlas string:
     ```bash
     MONGODB_URI="mongodb+srv://musabadmin:..." npx ts-node scripts/seed-templates.ts
     ```
   - Or run via Vercel CLI:
     ```bash
     vercel env pull .env.local  # get prod env vars
     npx ts-node scripts/seed-templates.ts
     ```

6. **Verify deployment**
   - Visit `https://YOUR-APP.vercel.app/api/health` → should return `{"status":"ok","db":"connected"}`
   - Visit `https://YOUR-APP.vercel.app` → landing page loads
   - Try OTP login → check inbox for code → log in
   - Visit dashboard → all panels should load

### Vercel environment variables — why this is the right way

- **Vercel env vars are encrypted at rest** and injected at build/runtime
- They're **not visible** in the deployed app's source code
- They can be **rotated without redeploying** (just update + redeploy)
- They support **per-environment values** (Production / Preview / Development)
- The repo stays clean and shareable

### MongoDB Atlas Network Access for Vercel

Vercel's serverless functions run on dynamic IPs. You have two options:
1. **Keep `0.0.0.0/0`** (any IP) — simplest, fine for personal apps with strong DB passwords
2. **Use Vercel's static IP ranges** — Vercel publishes their IP list; add each to Atlas. More secure but requires maintenance.

For most personal projects, `0.0.0.0/0` + strong password + MongoDB Atlas' built-in rate limiting is sufficient.

---

## License & ownership

Your data stays yours. Future versions will include CSV/JSON export (Milestone C). For now, you can query MongoDB directly.

Built by [Musab Projects](https://musab-007.netlify.app) — a project group by Musab Dawood.
