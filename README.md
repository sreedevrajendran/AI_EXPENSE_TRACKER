# AI-Powered Expense Tracker

A full-stack, iOS-styled expense tracker with AI automation built on Next.js, tRPC, Prisma, and Gemini 2.0 Flash.

## Tech Stack

- **Frontend**: Next.js 14-16 (App Router), Tailwind CSS v3 (iOS Design System), Framer Motion, Vaul
- **Backend**: tRPC, Next.js API Routes
- **Database**: PostgreSQL + Prisma ORM v5
- **Auth**: NextAuth v4 + Google OAuth
- **AI**: Vercel AI SDK + Gemini 2.0 Flash

## Getting Started

### 1. Configure Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your keys:

```bash
cp .env.local.example .env.local
```

You'll need:
- **`DATABASE_URL`**: PostgreSQL connection string (recommended: [Neon](https://neon.tech) free tier)
- **`NEXTAUTH_SECRET`**: Run `openssl rand -base64 32` to generate
- **`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`**: From [Google Cloud Console](https://console.cloud.google.com)
  - Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
- **`GEMINI_API_KEY`**: From [Google AI Studio](https://aistudio.google.com/app/apikey)

### 2. Set Up the Database

```bash
npm run db:migrate
```

### 3. Run the Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Features

- 📊 **Dashboard** — Monthly spend summary with budget health ring
- ➕ **Expense Logging** — Amount, category, merchant, payment method (Cash/Card/UPI/Bank)
- 📷 **Receipt Scanning** — AI OCR via Gemini to auto-fill expense forms
- 💰 **Budgets** — Color-coded progress bars (green/yellow/red)
- 🧠 **AI Coach** — Slide-up spending analysis with Gemini insights
- 🔒 **Privacy Mode** — Blur all balances with one tap
- 🌙 **Dark Mode** — Pure black iOS dark mode
- 📱 **PWA** — Installable mobile experience

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run db:migrate` | Run database migrations |
| `npm run db:studio` | Open Prisma Studio |
