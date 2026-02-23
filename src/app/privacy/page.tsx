import Link from "next/link";

export const metadata = {
    title: "Privacy Policy | AI Expense Tracker",
    description: "Privacy Policy for AI Expense Tracker — how we collect, use, and protect your data.",
};

export default function PrivacyPage() {
    const lastUpdated = "February 22, 2025";
    const appName = "AI Expense Tracker";
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
                    <h1 className="text-3xl font-bold text-[#1C1C1E] dark:text-white">Privacy Policy</h1>
                    <p className="text-sm text-[#8E8E93] mt-1">Last updated: {lastUpdated}</p>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">

                {/* Intro */}
                <section className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-6 space-y-3">
                    <p className="text-[#1C1C1E] dark:text-white leading-relaxed">
                        {appName} (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is committed to protecting your privacy. This Privacy Policy explains
                        how we collect, use, disclose, and safeguard your information when you use our web application
                        available at <a href={appUrl} className="text-[#007AFF] underline">{appUrl}</a>.
                        Please read this carefully. By using the app, you consent to this policy.
                    </p>
                </section>

                {/* Section: Information we collect */}
                <section className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-6 space-y-4">
                    <h2 className="text-xl font-semibold text-[#1C1C1E] dark:text-white">1. Information We Collect</h2>

                    <div className="space-y-3 text-[#3A3A3C] dark:text-[#EBEBF5]">
                        <div>
                            <h3 className="font-semibold text-[#1C1C1E] dark:text-white mb-1">Account Information</h3>
                            <p className="leading-relaxed text-sm">
                                When you sign in with Google, we receive your name, email address, and profile picture from Google's OAuth service.
                                We use this solely for authentication and to personalise your experience.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-[#1C1C1E] dark:text-white mb-1">Financial Data</h3>
                            <p className="leading-relaxed text-sm">
                                Expense, income, and budget data you enter is stored securely in our database. This data belongs to you
                                and is never sold or shared with third parties.
                            </p>
                        </div>

                        <div>
                            <h3 className="font-semibold text-[#1C1C1E] dark:text-white mb-1">Receipt Images</h3>
                            <p className="leading-relaxed text-sm">
                                If you upload a receipt image, it is temporarily processed by our AI (Groq API) to extract transaction details
                                and then stored in Cloudinary for your reference. You can delete it at any time.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-[#1C1C1E] dark:text-white mb-1">Usage Data</h3>
                            <p className="leading-relaxed text-sm">
                                We may collect anonymised usage data (e.g., page views) to improve the app. We do not use third-party advertising trackers.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Section: How we use information */}
                <section className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-6 space-y-3">
                    <h2 className="text-xl font-semibold text-[#1C1C1E] dark:text-white">2. How We Use Your Information</h2>
                    <ul className="list-disc list-inside space-y-2 text-sm text-[#3A3A3C] dark:text-[#EBEBF5] leading-relaxed">
                        <li>To authenticate you and maintain your account session</li>
                        <li>To display your financial data, charts, and insights within the app</li>

                        <li>To scan receipt images with AI to pre-fill expense forms</li>
                        <li>To provide AI-powered spending insights and chatbot answers about your own data</li>
                        <li>To improve the app&apos;s features and performance</li>
                    </ul>
                </section>



                {/* Section: Data sharing */}
                <section className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-6 space-y-3">
                    <h2 className="text-xl font-semibold text-[#1C1C1E] dark:text-white">4. Data Sharing & Third Parties</h2>
                    <p className="text-sm text-[#3A3A3C] dark:text-[#EBEBF5] leading-relaxed">
                        We do not sell your personal data. We use the following third-party services strictly to provide app functionality:
                    </p>
                    <ul className="list-disc list-inside space-y-1.5 text-sm text-[#3A3A3C] dark:text-[#EBEBF5]">
                        <li><strong>Google OAuth</strong> — authentication</li>
                        <li><strong>Supabase (PostgreSQL)</strong> — secure database hosting</li>
                        <li><strong>Groq (LLaMA AI)</strong> — receipt scanning and AI chatbot responses</li>
                        <li><strong>Cloudinary</strong> — receipt image storage</li>
                        <li><strong>Netlify</strong> — app hosting and deployment</li>
                    </ul>
                    <p className="text-sm text-[#3A3A3C] dark:text-[#EBEBF5] leading-relaxed">
                        Each of these providers has their own privacy policy and handles data according to their terms.
                    </p>
                </section>

                {/* Section: Data retention */}
                <section className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-6 space-y-3">
                    <h2 className="text-xl font-semibold text-[#1C1C1E] dark:text-white">5. Data Retention & Deletion</h2>
                    <p className="text-sm text-[#3A3A3C] dark:text-[#EBEBF5] leading-relaxed">
                        Your data is retained as long as your account is active. You may request deletion of your account and all
                        associated data at any time by contacting us at{" "}
                        <a href={`mailto:${contactEmail}`} className="text-[#007AFF] underline">{contactEmail}</a>.
                        We will process the request within 30 days.
                    </p>
                </section>

                {/* Section: Security */}
                <section className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-6 space-y-3">
                    <h2 className="text-xl font-semibold text-[#1C1C1E] dark:text-white">6. Security</h2>
                    <p className="text-sm text-[#3A3A3C] dark:text-[#EBEBF5] leading-relaxed">
                        We implement industry-standard security measures including encrypted connections (HTTPS),
                        secure session tokens, and protected database access.
                    </p>
                </section>

                {/* Section: Children */}
                <section className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-6 space-y-3">
                    <h2 className="text-xl font-semibold text-[#1C1C1E] dark:text-white">7. Children&apos;s Privacy</h2>
                    <p className="text-sm text-[#3A3A3C] dark:text-[#EBEBF5] leading-relaxed">
                        This service is not directed to children under the age of 13. We do not knowingly collect
                        personal data from children. If you believe a child has provided us with personal information,
                        please contact us and we will delete it.
                    </p>
                </section>

                {/* Section: Contact */}
                <section className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-6 space-y-3">
                    <h2 className="text-xl font-semibold text-[#1C1C1E] dark:text-white">8. Contact Us</h2>
                    <p className="text-sm text-[#3A3A3C] dark:text-[#EBEBF5] leading-relaxed">
                        If you have any questions about this Privacy Policy, please contact us at:{" "}
                        <a href={`mailto:${contactEmail}`} className="text-[#007AFF] underline font-medium">{contactEmail}</a>
                    </p>
                </section>

                {/* Footer links */}
                <div className="flex gap-4 text-sm text-[#8E8E93] pb-4">
                    <Link href="/terms" className="text-[#007AFF]">Terms of Service</Link>
                    <span>·</span>
                    <Link href="/login" className="hover:text-[#007AFF] transition-colors">Back to App</Link>
                </div>
            </div>
        </div>
    );
}
