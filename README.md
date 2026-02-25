# 💸 Floww

👉 **AI Document Intelligence + Financial Analytics Platform**

Floww transcends the traditional "expense tracker" by operating as a powerful **Cross-Domain Core Engine**. It ingests unstructured data (images, PDFs, text) and pipelines it into structured, actionable financial insights. 

---

## ⚡ Core Reusable Modules (The Engine)

At the heart of Floww is a modular, scalable architecture designed to be extensible. These core modules can be adapted and domain plugins can be built on top of them:

- 📷 **OCR/Vision AI** — Intelligent extraction of data from receipts, itemized bills, and multi-page bank statements.
- 🤖 **Auto Categorization** — NLP-powered fuzzy-matching to automatically route and classify extracted data streams.
- 🎯 **Budget Engine** — Real-time tracking and threshold alerting system built on top of live data streams.
- 🧠 **Insights Engine** — Automated trend analysis and predictive anomaly detection for financial health.
- 💬 **Chatbot (Agent Floww)** — A context-aware LLM agent capable of querying the user's live database via natural language.
- 📊 **Reports** — Dynamic, interactive charting and analytics dashboards.

---

## 🏗️ Technical Capabilities

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
