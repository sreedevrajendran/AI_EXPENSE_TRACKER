# 💸 Floww

A smart, mobile-first personal finance app that uses AI to automatically track your spending from receipts and bank statements.

> Built with Next.js · TypeScript · tRPC · Prisma · Google Gemini · Tailwind CSS

---

## ✨ Features

- 📷 **Document Intelligence** — Snap a photo of a receipt or bank statement, AI extracts all the details
- 🤖 **Auto-categorization** — AI automatically assigns the correct category based on your data
- 💬 **Agent Floww** — Ask natural-language questions about your spending and financial data
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
| Database | PostgreSQL + Prisma (Neon) |
| Auth | NextAuth.js (Google OAuth) |
| AI | Google Gemini 2.5 Flash |
| Styling | Tailwind CSS + Framer Motion |
| Deploy | Netlify |

## 🚀 Getting Started

```bash
git clone https://github.com/sreedevrajendran/AI_EXPENSE_TRACKER.git
cd AI_EXPENSE_TRACKER
npm install
cp .env.example .env.local   # Fill in your keys
npm run dev
