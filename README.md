# Habit & Mood Tracker

> **Built by [Musab Projects](https://musab-007.netlify.app)** — a project group by Musab Dawood

A personal-data platform for tracking habits and mood, exploring statistical correlations, and building habits around identity rather than shame-based streaks.

## Features

- Authentication with Google OAuth and OTP credentials
- Low-friction daily mood check-ins
- Habit, identity, and habit-template management
- Dashboard with mood trends, completion percentages, streaks, and a 90-day heatmap
- Grace-day-aware streak calculations
- Correlation analysis using Pearson correlation, p-values, sample size, and confounder checks
- Cached correlation results for efficient dashboard loading
- AI weekly-insight integration support
- Browser push, accountability, and export features prepared for continued development

## Tech stack

| Area | Technology |
|---|---|
| Framework | Next.js 15 with App Router |
| Language | TypeScript 5.7 |
| Database | MongoDB with Mongoose 8.8 |
| Authentication | NextAuth.js 4 with Google OAuth and OTP credentials |
| Styling | Tailwind CSS 3.4 |
| Charts | Recharts 2.15 |
| Statistics | simple-statistics and jStat |
| Email | Nodemailer |
| AI | Anthropic SDK integration |
| Export | jsPDF and jsPDF AutoTable |
| Notifications | Web Push |

## Getting started

### Prerequisites

- Node.js 20+
- MongoDB or MongoDB Atlas
- Optional Google OAuth, SMTP, Anthropic, and Web Push credentials

### Installation

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

To seed habit templates:

```bash
npm run seed:templates
```

## Available scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Start the production server |
| `npm run lint` | Run Next.js linting |
| `npm run typecheck` | Run TypeScript without emitting files |
| `npm run seed:templates` | Seed habit templates |

## Project structure

```text
Habit-Mood-Tracker/
├── src/app/              # Pages, layouts, and API routes
├── src/components/       # Navigation, forms, charts, and habit UI
├── src/lib/              # Auth, database, email, statistics, and utilities
├── src/models/           # MongoDB models
├── scripts/              # Data-seeding scripts
└── public/               # Static assets
```

## Security

Keep `.env.local` out of version control. Rotate MongoDB, SMTP, OAuth, AI, and NextAuth credentials immediately if they are exposed.

## License

Built by [Musab Projects](https://musab-007.netlify.app) — a project group by Musab Dawood.
