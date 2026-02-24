import Link from "next/link";

export const metadata = {
    title: "Terms of Service | Floww",
    description: "Terms of Service for Floww — AI Expense Tracker.",
};

export default function TermsPage() {
    const lastUpdated = "February 24, 2025";
    const appName = "Floww";
    const contactEmail = "sreerajar40@gmail.com";
    const appUrl = "https://ai-expense-tracker.netlify.app";

    return (
        <div className="min-h-screen bg-[#F2F2F7] dark:bg-black">
            {/* Header */}
            <div className="bg-white dark:bg-[#1C1C1E] border-b border-[#E5E5EA] dark:border-[#3A3A3C]">
                <div className="max-w-3xl mx-auto px-6 py-6">
                    <Link href="/login" className="text-[#007AFF] text-sm font-medium mb-4 inline-block">
                        ← Back to App
                    </Link>
                    <h1 className="text-3xl font-bold text-[#1C1C1E] dark:text-white">Terms of Service</h1>
                    <p className="text-sm text-[#8E8E93] mt-1">Last updated: {lastUpdated}</p>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">

                {/* Intro */}
                <section className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-6 space-y-3">
                    <p className="text-sm text-[#3A3A3C] dark:text-[#EBEBF5] leading-relaxed">
                        Welcome to {appName}. By accessing or using our application at{" "}
                        <a href={appUrl} className="text-[#007AFF] underline">{appUrl}</a>, you agree to be bound
                        by these Terms of Service. If you do not agree, do not use this service.
                    </p>
                </section>

                {/* 1. Use of Service */}
                <section className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-6 space-y-3">
                    <h2 className="text-xl font-semibold text-[#1C1C1E] dark:text-white">1. Use of Service</h2>
                    <p className="text-sm text-[#3A3A3C] dark:text-[#EBEBF5] leading-relaxed">
                        {appName} is a personal finance management tool. You may use it for personal, non-commercial purposes
                        to track your own income, expenses, and budgets. You must be at least 13 years old to use this service.
                    </p>
                    <p className="text-sm text-[#3A3A3C] dark:text-[#EBEBF5] leading-relaxed">
                        You agree not to misuse the service, including but not limited to: reverse engineering the app,
                        attempting to access other users&apos; data, uploading malicious content, or using the app for any unlawful purpose.
                    </p>
                </section>

                {/* 2. Account */}
                <section className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-6 space-y-3">
                    <h2 className="text-xl font-semibold text-[#1C1C1E] dark:text-white">2. Your Account</h2>
                    <p className="text-sm text-[#3A3A3C] dark:text-[#EBEBF5] leading-relaxed">
                        You are responsible for maintaining the security of your Google account used to sign in.
                        All activity performed under your account is your responsibility. Notify us immediately at{" "}
                        <a href={`mailto:${contactEmail}`} className="text-[#007AFF] underline">{contactEmail}</a> if
                        you suspect unauthorised access.
                    </p>
                </section>

                {/* 3. AI Features */}
                <section className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-6 space-y-3">
                    <h2 className="text-xl font-semibold text-[#1C1C1E] dark:text-white">3. AI Features</h2>
                    <p className="text-sm text-[#3A3A3C] dark:text-[#EBEBF5] leading-relaxed">
                        {appName} provides several AI-powered features including:
                    </p>
                    <ul className="list-disc list-inside space-y-1.5 text-sm text-[#3A3A3C] dark:text-[#EBEBF5]">
                        <li><strong>Receipt &amp; Document Scanning</strong> — AI extracts expense details from images or PDFs</li>
                        <li><strong>Bank Statement Import</strong> — AI categorises bulk transactions from your bank statement</li>
                        <li><strong>AI Coach</strong> — personalised monthly spending insights and health score</li>
                        <li><strong>Agent Floww</strong> — an AI chatbot that answers questions about your finances</li>
                    </ul>
                    <p className="text-sm text-[#3A3A3C] dark:text-[#EBEBF5] leading-relaxed">
                        These features use third-party AI models (Groq / Llama 4). AI-generated results may not always be accurate.
                        You should review and verify all AI-extracted data before relying on it. {appName} is not liable for financial
                        decisions made based on AI-generated content.
                    </p>
                </section>

                {/* 4. Your Data */}
                <section className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-6 space-y-3">
                    <h2 className="text-xl font-semibold text-[#1C1C1E] dark:text-white">4. Your Data</h2>
                    <p className="text-sm text-[#3A3A3C] dark:text-[#EBEBF5] leading-relaxed">
                        You retain full ownership of all financial data you input into {appName}. We store your data
                        to provide the service and will never sell it. You can request deletion of your data at any time.
                        Refer to our <Link href="/privacy" className="text-[#007AFF] underline">Privacy Policy</Link> for full details.
                    </p>
                </section>

                {/* 5. Intellectual Property */}
                <section className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-6 space-y-3">
                    <h2 className="text-xl font-semibold text-[#1C1C1E] dark:text-white">5. Intellectual Property</h2>
                    <p className="text-sm text-[#3A3A3C] dark:text-[#EBEBF5] leading-relaxed">
                        The {appName} application, including its design, code, and features, is the intellectual property
                        of its developer. You retain ownership of all financial data you input. You grant us a limited
                        licence to store and process your data solely for the purpose of providing the service.
                    </p>
                </section>

                {/* 6. Disclaimers */}
                <section className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-6 space-y-3">
                    <h2 className="text-xl font-semibold text-[#1C1C1E] dark:text-white">6. Disclaimers</h2>
                    <p className="text-sm text-[#3A3A3C] dark:text-[#EBEBF5] leading-relaxed">
                        {appName} is provided &quot;as is&quot; without warranties of any kind. We do not guarantee uninterrupted
                        access, accuracy of AI outputs, or that the service will be error-free. This app is not a
                        registered financial advisor and does not provide certified financial advice.
                    </p>
                </section>

                {/* 7. Limitation of Liability */}
                <section className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-6 space-y-3">
                    <h2 className="text-xl font-semibold text-[#1C1C1E] dark:text-white">7. Limitation of Liability</h2>
                    <p className="text-sm text-[#3A3A3C] dark:text-[#EBEBF5] leading-relaxed">
                        To the fullest extent permitted by law, {appName} and its developer shall not be liable for any
                        indirect, incidental, special, or consequential damages arising from your use or inability
                        to use the service, including any loss of data or financial loss.
                    </p>
                </section>

                {/* 8. Termination */}
                <section className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-6 space-y-3">
                    <h2 className="text-xl font-semibold text-[#1C1C1E] dark:text-white">8. Termination</h2>
                    <p className="text-sm text-[#3A3A3C] dark:text-[#EBEBF5] leading-relaxed">
                        We reserve the right to suspend or terminate your access to the service at any time, for any
                        reason, including violation of these terms. You may stop using the service at any time and
                        request deletion of your data by emailing{" "}
                        <a href={`mailto:${contactEmail}`} className="text-[#007AFF] underline">{contactEmail}</a>.
                    </p>
                </section>

                {/* 9. Changes */}
                <section className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-6 space-y-3">
                    <h2 className="text-xl font-semibold text-[#1C1C1E] dark:text-white">9. Changes to Terms</h2>
                    <p className="text-sm text-[#3A3A3C] dark:text-[#EBEBF5] leading-relaxed">
                        We may update these Terms from time to time. Continued use of the service after changes
                        constitutes acceptance of the updated Terms. The &quot;Last updated&quot; date at the top reflects
                        the most recent revision.
                    </p>
                </section>

                {/* 10. Contact */}
                <section className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-6 space-y-3">
                    <h2 className="text-xl font-semibold text-[#1C1C1E] dark:text-white">10. Contact</h2>
                    <p className="text-sm text-[#3A3A3C] dark:text-[#EBEBF5] leading-relaxed">
                        Questions about these Terms? Contact us at:{" "}
                        <a href={`mailto:${contactEmail}`} className="text-[#007AFF] underline font-medium">{contactEmail}</a>
                    </p>
                </section>

                {/* Footer */}
                <div className="flex gap-4 text-sm text-[#8E8E93] pb-4">
                    <Link href="/privacy" className="text-[#007AFF]">Privacy Policy</Link>
                    <span>·</span>
                    <Link href="/login" className="hover:text-[#007AFF] transition-colors">Back to App</Link>
                </div>
            </div>
        </div>
    );
}
