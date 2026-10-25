import Link from "next/link";

export const metadata = {
    title: "Terms of Service | Floww",
    description: "Terms of Service for Floww — Enterprise-Grade Financial Intelligence & Expense Management Platform.",
};

export default function TermsPage() {
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
                    <h1 className="text-3xl font-bold text-[#1C1C1E] dark:text-white">Terms of Service</h1>
                    <p className="text-sm text-[#8E8E93] mt-1">Effective Date: {lastUpdated}</p>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
                {/* Intro */}
                <section className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-6 border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-3">
                    <p className="text-[#1C1C1E] dark:text-white leading-relaxed text-sm">
                        Welcome to {appName}. By accessing, subscribing to, or using the Floww platform via our web interface or 
                        mobile native client applications, you enter into a binding agreement and agree to be governed by these Terms of Service.
                    </p>
                </section>

                {/* 1. Scope & Permitted Use */}
                <section className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-6 border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-3">
                    <h2 className="text-xl font-bold text-[#1C1C1E] dark:text-white">1. Scope of Service &amp; Permitted Use</h2>
                    <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                        {appName} delivers automated bookkeeping, receipt parsing, statement processing, and financial intelligence tools. 
                        You may utilize the platform for personal financial tracking and business expense reporting in compliance with applicable laws.
                    </p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                        You agree not to reverse engineer the underlying algorithms, introduce malicious payloads, or disrupt platform infrastructure.
                    </p>
                </section>

                {/* 2. AI Intelligence & Non-Advisory Disclaimer */}
                <section className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-6 border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-3">
                    <h2 className="text-xl font-bold text-[#1C1C1E] dark:text-white">2. AI Models &amp; Non-Advisory Notice</h2>
                    <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                        Floww integrates automated optical character recognition (OCR) and multimodal generative AI models to classify expenses 
                        and synthesize financial summaries. While our parsing algorithms operate with high precision, machine learning extractions 
                        should be reviewed for critical accounting workflows.
                    </p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed font-medium">
                        Floww is an analytics productivity software platform and does not constitute a certified financial advisor, certified public accountant (CPA), 
                        or tax consultancy service.
                    </p>
                </section>

                {/* 3. Account Ownership & Data Confidentiality */}
                <section className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-6 border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-3">
                    <h2 className="text-xl font-bold text-[#1C1C1E] dark:text-white">3. Data Ownership &amp; Security</h2>
                    <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                        You retain full, exclusive intellectual and proprietary ownership over all ledger items, receipts, and financial records 
                        logged in Floww. Floww holds a strictly limited, non-exclusive license to process such data solely to execute requested services.
                    </p>
                </section>

                {/* 4. Service Continuity & Modifications */}
                <section className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-6 border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-3">
                    <h2 className="text-xl font-bold text-[#1C1C1E] dark:text-white">4. Availability &amp; Platform Updates</h2>
                    <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                        We continuously deploy software updates, performance optimizations, and feature enhancements. We strive for 99.9% uptime 
                        but do not warrant uninterrupted operation during scheduled maintenance windows.
                    </p>
                </section>

                {/* 5. Contact */}
                <section className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-6 border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-3">
                    <h2 className="text-xl font-bold text-[#1C1C1E] dark:text-white">5. Legal Inquiries</h2>
                    <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                        For contractual or legal inquiries regarding these Terms, contact our legal counsel team at{" "}
                        <a href={`mailto:${contactEmail}`} className="text-ios-blue underline font-semibold">{contactEmail}</a>.
                    </p>
                </section>

                {/* Footer */}
                <div className="flex gap-4 text-xs font-semibold text-neutral-500 dark:text-neutral-400 pt-2 pb-6">
                    <Link href="/privacy" className="hover:text-ios-blue transition-colors">Privacy Policy</Link>
                    <span>&bull;</span>
                    <Link href="/settings" className="hover:text-ios-blue transition-colors">Settings</Link>
                    <span>&bull;</span>
                    <Link href="/" className="hover:text-ios-blue transition-colors">Dashboard</Link>
                </div>
            </div>
        </div>
    );
}
