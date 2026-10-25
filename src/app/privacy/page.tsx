import Link from "next/link";

export const metadata = {
    title: "Privacy Policy | Floww",
    description: "Privacy Policy for Floww — Enterprise-Grade Financial Intelligence & Personal Expense Platform. Learn how we safeguard and protect your financial data.",
};

export default function PrivacyPage() {
    const lastUpdated = "October 25, 2026";
    const appName = "Floww";
    const contactEmail = "support@floww.finance";

    return (
        <div className="min-h-screen bg-[#F2F2F7] dark:bg-black">
            {/* Header */}
            <div className="bg-white dark:bg-[#1C1C1E] border-b border-[#E5E5EA] dark:border-[#3A3A3C]">
                <div className="max-w-3xl mx-auto px-6 py-6">
                    <Link href="/settings" className="text-ios-blue text-sm font-semibold mb-4 inline-flex items-center gap-1.5 hover:opacity-80 transition-opacity">
                        &larr; Back to Settings
                    </Link>
                    <h1 className="text-3xl font-bold text-[#1C1C1E] dark:text-white">Privacy Policy</h1>
                    <p className="text-sm text-[#8E8E93] mt-1">Effective Date: {lastUpdated}</p>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
                {/* Intro */}
                <section className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-6 border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-3">
                    <p className="text-[#1C1C1E] dark:text-white leading-relaxed text-sm">
                        {appName} (&quot;we&quot;, &quot;our&quot;, or &quot;the Platform&quot;) is engineered with privacy as a foundational principle. 
                        This Privacy Policy delineates our rigorous standards for data collection, processing, storage, and confidentiality when you access 
                        Floww via our web application and mobile native applications.
                    </p>
                    <p className="text-[#1C1C1E] dark:text-white leading-relaxed text-sm font-medium">
                        We never sell, rent, monetize, or broker your personal or financial data to third-party data brokers or advertisers.
                    </p>
                </section>

                {/* Section 1: Information Collected */}
                <section className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-6 border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-4">
                    <h2 className="text-xl font-bold text-[#1C1C1E] dark:text-white">1. Information We Collect</h2>

                    <div className="space-y-4 text-neutral-600 dark:text-neutral-300 text-sm">
                        <div>
                            <h3 className="font-bold text-neutral-900 dark:text-white mb-1">Identity &amp; Authentication</h3>
                            <p className="leading-relaxed">
                                When authenticating via Google Sign-In or Single Sign-On (SSO), we receive your primary profile identifier, name, 
                                and verified email address solely to establish and secure your isolated user account space.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-bold text-neutral-900 dark:text-white mb-1">Financial Records &amp; Budgets</h3>
                            <p className="leading-relaxed">
                                Transaction records (amounts, merchants, payment methods, reference IDs, categories, and timestamps), incomes, 
                                and category budgets that you record are stored in encrypted multi-tenant cloud storage bound exclusively to your user ID.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-bold text-neutral-900 dark:text-white mb-1">Document &amp; Receipt Processing</h3>
                            <p className="leading-relaxed">
                                Uploaded documents (PDF bank statements, invoice scans, receipt photographs) are parsed via encrypted in-memory buffers 
                                to extract line items, merchant metadata, and payment references. Statement files are processed ephemerally and never permanently 
                                retained without explicit user confirmation.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-bold text-neutral-900 dark:text-white mb-1">Natural Language &amp; AI Intelligence</h3>
                            <p className="leading-relaxed">
                                Conversations with Agent Floww and automated financial insights utilize state-of-the-art multimodal large language models 
                                (Google Gemini Enterprise API) strictly for processing prompts. Your private data is never used to train global public foundational models.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Section 2: Usage */}
                <section className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-6 border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-3">
                    <h2 className="text-xl font-bold text-[#1C1C1E] dark:text-white">2. How We Use Your Data</h2>
                    <ul className="list-disc list-inside space-y-2 text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                        <li>Calculate dynamic net balance, cash flow, and monthly category burn rates</li>
                        <li>Automate extraction of UTRs, invoice IDs, GST breakdowns, and payment channels from receipts</li>
                        <li>Execute natural language accounting actions initiated via Agent Floww</li>
                        <li>Enforce proactive category budget limits and velocity anomaly alerts</li>
                        <li>Generate official digital ledger statements and encrypted offline JSON backups</li>
                    </ul>
                </section>

                {/* Section 3: Data Security */}
                <section className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-6 border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-3">
                    <h2 className="text-xl font-bold text-[#1C1C1E] dark:text-white">3. Security Standards &amp; Architecture</h2>
                    <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                        All communications are encrypted in transit using TLS 1.3 cryptographic protocols. Databases are protected with AES-256 bit 
                        encryption at rest. Authentication tokens are cryptographically signed using high-entropy secret rotation.
                    </p>
                </section>

                {/* Section 4: Data Rights & Deletion */}
                <section className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-6 border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-3">
                    <h2 className="text-xl font-bold text-[#1C1C1E] dark:text-white">4. User Autonomy &amp; Data Deletion</h2>
                    <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                        You maintain unconditional ownership of your financial records. You can:
                    </p>
                    <ul className="list-disc list-inside space-y-1.5 text-sm text-neutral-600 dark:text-neutral-300">
                        <li>Download your complete transaction ledger as a formal PDF statement or raw JSON archive at any time</li>
                        <li>Revert any imported bank statement batch instantly via Settings</li>
                        <li>Permanently delete individual records or execute a complete account wipe with immediate database purge</li>
                    </ul>
                </section>

                {/* Section 5: Contact */}
                <section className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-6 border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-3">
                    <h2 className="text-xl font-bold text-[#1C1C1E] dark:text-white">5. Contact Governance</h2>
                    <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                        For inquiries concerning our privacy practices or data subject requests, contact our privacy officer at{" "}
                        <a href={`mailto:${contactEmail}`} className="text-ios-blue underline font-semibold">{contactEmail}</a>.
                    </p>
                </section>

                {/* Footer links */}
                <div className="flex gap-4 text-xs font-semibold text-neutral-500 dark:text-neutral-400 pt-2 pb-6">
                    <Link href="/terms" className="hover:text-ios-blue transition-colors">Terms of Service</Link>
                    <span>&bull;</span>
                    <Link href="/settings" className="hover:text-ios-blue transition-colors">Settings</Link>
                    <span>&bull;</span>
                    <Link href="/" className="hover:text-ios-blue transition-colors">Dashboard</Link>
                </div>
            </div>
        </div>
    );
}
