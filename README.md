# 💸 Floww — AI-Powered Financial Intelligence Platform

> **Modern, enterprise-grade personal finance, expense tracking, and automated document parsing powered by Next.js, tRPC, and Google Gemini AI.**

Floww is an open-source financial operating system designed to eliminate manual bookkeeping. It automatically ingests unstructured receipts, invoices, and multi-page bank statements, classifies transactions using machine learning, and provides conversational AI financial insights.

Built for both **Modern Web (v2.0.1)** and **Native Android** via Capacitor.

### 📱 Android APK Download
Download and install the native Android build directly:
- 📦 **[Download Floww v2.0.1 APK (Official Release)](https://github.com/sreedevrajendran/Floww/releases/download/v2.0.1/Floww-v2.0.1.apk)** (~8.9 MB)
- 📁 Repository file mirror: [`release/Floww-v2.0.1.apk`](release/Floww-v2.0.1.apk)

---

## ✨ Features

### 📷 Multimodal Receipt & Invoice OCR
- Snap a photo or upload an image/PDF of any receipt, grocery bill, or payment invoice.
- Powered by **Google Gemini 2.5 Flash** for high-precision entity extraction (merchant, total amount, date, tax, payment method, and itemized breakdown).
- Fast pre-submission review sheet to inspect and edit extracted values before saving.

### 📄 Bank Statement Parser & Batch Reconciliation
- Ingest complex multi-page PDF or image bank statements.
- Automatically detects and parses columnar transaction tables into structured expense and income ledgers.
- **Batch tracking & rollback**: Every imported statement is tagged with a batch identifier, allowing 1-click rollback from Settings without affecting manual transactions or custom categories.

### 💬 Agent Floww — Financial Assistant
- Context-aware financial assistant with retrieval-augmented generation (RAG) over your ledger.
- Natural language logging: Type *"Spent ₹450 on dinner with card"* or *"Got ₹65,000 salary deposit"* to auto-create structured transactions with one tap.
- Proactive spending queries: Ask *"How much did I spend on groceries last month?"* or *"Analyze my weekend dining habits."*

### 🎯 Dynamic Budgeting & Threshold Alerts
- Set monthly or custom category budgets.
- Live progress rings, spend pacing indicators, and visual warnings as categories approach limit.

### 📋 Industry-Standard Transaction Statements
- Filter by **This Month**, **Last 3 Months**, **Financial Year (Apr–Mar)**, or **All Time**.
- Generates clean, printable bank-grade digital statements with summary balances and category breakdowns.

### 🔒 Enterprise Privacy & Zero Friction
- **Privacy Mode**: One-tap toggle to mask balances and transaction numbers in public environments.
- **Zero-Config Local Fallback**: Runs out of the box with an intelligent local JSON database when Firebase credentials are not supplied, making local development and self-hosting effortless.
- **Offline JSON Backups**: Export and import complete encrypted financial ledgers anytime.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router, Server Actions, Standalone) |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) |
| **API Layer** | [tRPC v11](https://trpc.io/) (End-to-end type safety) & TanStack React Query |
| **Styling & UI** | [Tailwind CSS](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/), [Vaul Drawers](https://vaul.emilkowal.ski/), [Lucide Icons](https://lucide.dev/) |
| **AI / OCR** | [Google Gemini 2.5 Flash](https://ai.google.dev/) via `@google/genai` |
| **PDF Extraction** | `unpdf` & `pdf-parse` (In-memory buffer processing) |
| **Mobile Runtime**| [Capacitor 8](https://capacitorjs.com/) (Android native build) |
| **Database** | Cloud Firestore / Local persistent JSON mock DB engine |
| **Auth** | NextAuth.js (Google OAuth & Demo session support) |

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js** 18.18.0 or newer
- **npm** 9.0.0 or newer
- *(Optional)* **Android Studio** if building the native Android mobile app

### 2. Clone Repository
```bash
git clone https://github.com/sreedevrajendran/Floww.git
cd Floww
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
Copy the example environment template:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your preferred credentials:
```env
# NextAuth Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate_a_random_32_character_secret

# Google OAuth (Optional for local dev)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Google Gemini API Key (Required for receipt scanning & Agent Floww)
GEMINI_API_KEY=your_gemini_api_key_from_google_ai_studio

# Firebase Admin SDK (Optional - app falls back to local storage if omitted)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

> **Note**: If `FIREBASE_PROJECT_ID` is omitted, Floww will automatically use its built-in local persistent database (`.data/`), allowing full functionality without cloud configuration.

### 5. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📱 Android App (Native)

Floww includes complete native Android support via Capacitor:

```bash
# Build the production web bundle
npm run build

# Sync web assets to the Android project
npm run cap:sync

# Open the project in Android Studio
npm run cap:open
```

From Android Studio, connect an Android device or emulator and click **Run**.

---

## 📁 Project Architecture

```
Floww/
├── android/                   # Capacitor native Android wrapper
├── public/                    # Static assets & icons
│   └── uploads/               # Local staging (git-ignored)
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (app)/             # Authenticated views (Home, Expenses, Incomes, Budgets, Settings)
│   │   ├── api/               # API routes (tRPC, NextAuth, file uploads)
│   │   ├── privacy/           # Privacy policy
│   │   └── terms/             # Terms of service
│   ├── components/
│   │   ├── ai/                # Agent Floww Chat & AI Coach
│   │   ├── dashboard/         # Visual financial analytics & charts
│   │   ├── expenses/          # Expense sheets, charts & forms
│   │   ├── income/            # Income sheets & forms
│   │   ├── layout/            # Desktop sidebar, bottom tab bar, header, action sheet
│   │   ├── transactions/      # Bill & Bank Statement review drawers
│   │   └── ui/                # Custom alert cards, pull-to-refresh, privacy wrappers
│   ├── lib/
│   │   ├── ai/                # Gemini RAG engine & financial assistant prompts
│   │   ├── bankStatement.ts   # Printable transaction statement generator
│   │   ├── bankStatementParser.ts # Multi-page PDF bank statement parser
│   │   ├── firebase/          # Firebase Admin & local mock database engine
│   │   ├── ml/                # Naive Bayes & TF-IDF transaction classifier
│   │   └── notifications.ts   # Push reminders & multi-scenario notifications
│   └── server/
│       ├── routers/           # tRPC routers (expense, income, budget, category, ai)
│       └── trpc.ts            # tRPC context & procedures
├── capacitor.config.ts        # Capacitor configuration
├── next.config.ts             # Next.js configuration
├── package.json               # Dependencies & scripts
└── README.md                  # Project documentation
```

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
Feel free to check the [issues page](https://github.com/sreedevrajendran/Floww/issues).

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.
