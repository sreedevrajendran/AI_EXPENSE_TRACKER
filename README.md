# 💸 AI Expense Tracker

A smart, mobile-first personal finance app that uses AI to automatically track your spending from receipts and Gmail purchase emails.

> Built with Next.js · TypeScript · tRPC · Prisma · Groq AI · Gmail API · Tailwind CSS

---

## ✨ Features

- 📷 **Receipt Scanner** — Snap a photo, AI fills in all the details
- 📧 **Gmail AI Sync** — Auto-imports purchase emails as expenses
- 💬 **AI Chatbot** — Ask natural-language questions about your spending
- 📊 **Analytics Dashboard** — Income vs expenses, category breakdowns, budget tracking
- 🎯 **Budget Management** — Set monthly budgets per category with real-time alerts
- 🔒 **Privacy Mode** — Blur all amounts with one tap
- 📱 **PWA** — Install on iOS/Android like a native app
- 🌙 **Dark Mode** — Full dark/light theme support

## 🛠️ Tech Stack

| | |
|---|---|
| Framework | Next.js 15 (App Router) |
| API | tRPC |
| Database | PostgreSQL + Prisma (Supabase) |
| Auth | NextAuth.js |
| AI | Groq (LLaMA 3) |
| Email | Gmail API (OAuth 2.0) |
| Styling | Tailwind CSS + Framer Motion |
| Deploy | Netlify |

## 🚀 Getting Started

```bash
git clone https://github.com/sreedevrajendran/AI_EXPENSE_TRACKER.git
cd AI_EXPENSE_TRACKER
npm install
cp .env.example .env.local   # Fill in your keys
npm run dev
