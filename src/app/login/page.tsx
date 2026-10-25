"use client";

import { signIn } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Camera,
    Brain,
    PieChart,
    Shield,
    TrendingUp,
    Sparkles,
    ArrowRight,
    Check,
    Lock,
    Mail,
    Eye,
    EyeOff,
    User,
    AlertCircle,
    Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";

const features = [
    { icon: Camera, label: "AI Receipt Scanner", color: "#007AFF" },
    { icon: Brain, label: "AI Finance Coach", color: "#FF9F0A" },
    { icon: PieChart, label: "Smart Budgets", color: "#34C759" },
    { icon: TrendingUp, label: "Income & Cashflow", color: "#30D158" },
    { icon: Sparkles, label: "Agent Floww AI", color: "#5856D6" },
    { icon: Shield, label: "Bank Statement Import", color: "#5AC8FA" },
];

const taglines = [
    "Financial clarity, engineered for speed.",
    "Scan receipts. Import statements. Track every rupee.",
    "Your intelligent financial companion.",
    "Smart budgets and automated ledger intelligence.",
];

const highlights = [
    "Autonomous receipt OCR & bank statement parsing",
    "Real-time budget alerts before you overspend",
    "Agent Floww: conversational AI financial assistant",
    "100% private, encrypted ledger with zero ads",
];

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [taglineIdx, setTaglineIdx] = useState(0);
    const [displayed, setDisplayed] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    // Typewriter effect
    useEffect(() => {
        const current = taglines[taglineIdx];
        let timeout: ReturnType<typeof setTimeout>;

        if (!isDeleting && displayed.length < current.length) {
            timeout = setTimeout(() => setDisplayed(current.slice(0, displayed.length + 1)), 50);
        } else if (!isDeleting && displayed.length === current.length) {
            timeout = setTimeout(() => setIsDeleting(true), 2400);
        } else if (isDeleting && displayed.length > 0) {
            timeout = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 25);
        } else if (isDeleting && displayed.length === 0) {
            setIsDeleting(false);
            setTaglineIdx((prev) => (prev + 1) % taglines.length);
        }
        return () => clearTimeout(timeout);
    }, [displayed, isDeleting, taglineIdx]);

    const handleCredentialsSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const cleanEmail = email.trim().toLowerCase();
        if (!cleanEmail || !password) {
            setError("Please fill in both email and password.");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        setIsLoading(true);

        try {
            const res = await signIn("credentials", {
                redirect: false,
                email: cleanEmail,
                password,
                name: isSignUp ? name.trim() || cleanEmail.split("@")[0] : undefined,
                action: isSignUp ? "signup" : "signin",
                callbackUrl: "/",
            });

            if (res?.error) {
                // Friendly error formatting
                if (res.error.includes("CredentialsSignin")) {
                    setError("Incorrect email or password. Please try again.");
                } else {
                    setError(res.error);
                }
                setIsLoading(false);
            } else if (res?.ok) {
                // Successful sign-in -> navigate straight into the app
                window.location.href = "/";
            } else {
                setError("Authentication failed. Please verify credentials.");
                setIsLoading(false);
            }
        } catch (err: any) {
            setError(err?.message || "An unexpected error occurred. Please try again.");
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setIsGoogleLoading(true);
        setError(null);
        const currentOrigin = typeof window !== "undefined" ? window.location.origin : "";
        const callbackUrl = `${currentOrigin}/`;

        try {
            await signIn("google", { callbackUrl });
        } catch (err: any) {
            setError("Google sign in could not be completed. You can sign in with email & password above.");
            setIsGoogleLoading(false);
        }
    };

    return (
        <div className="min-h-dvh relative overflow-hidden bg-[#070913] text-white flex flex-col justify-between selection:bg-blue-500 selection:text-white">

            {/* ─── Ambient Glow Background ─────────────────────────── */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-b from-[#070913] via-[#0B0F24] to-[#070913]" />

                {/* Luminous Orbs */}
                <motion.div
                    className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full"
                    style={{ background: "radial-gradient(circle, rgba(0,122,255,0.18) 0%, transparent 68%)" }}
                    animate={{ opacity: [0.5, 0.85, 0.5], scale: [0.95, 1.05, 0.95] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                    className="absolute -bottom-40 right-[-10%] w-[500px] h-[500px] rounded-full"
                    style={{ background: "radial-gradient(circle, rgba(88,86,214,0.15) 0%, transparent 70%)" }}
                    animate={{ opacity: [0.4, 0.75, 0.4] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* Subtle Grid Overlay */}
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: `linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)`,
                        backgroundSize: "44px 44px",
                    }}
                />
            </div>

            {/* ─── Main Center Container ──────────────────────────── */}
            <main className="relative z-10 w-full max-w-[430px] mx-auto px-5 pt-[max(env(safe-area-inset-top,20px),2.5rem)] pb-6 flex flex-col gap-6">

                {/* Brand Hero */}
                <motion.div
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="flex flex-col items-center text-center gap-2 pt-2"
                >
                    <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                        Welcome to Floww
                    </h1>
                    <div className="h-6 flex items-center justify-center mt-1">
                        <p className="text-xs sm:text-sm font-medium text-neutral-400">
                            {displayed}
                            <span className="inline-block w-[2px] h-3.5 bg-blue-400 ml-1 align-middle animate-pulse" />
                        </p>
                    </div>
                </motion.div>

                {/* Feature Ticker Strip */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="relative overflow-hidden py-0.5"
                >
                    <div className="absolute left-0 top-0 bottom-0 w-8 z-10 bg-gradient-to-r from-[#070913] to-transparent pointer-events-none" />
                    <div className="absolute right-0 top-0 bottom-0 w-8 z-10 bg-gradient-to-l from-[#070913] to-transparent pointer-events-none" />

                    <motion.div
                        className="flex gap-2.5 w-max"
                        animate={{ x: ["0%", "-50%"] }}
                        transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
                    >
                        {[...features, ...features].map(({ icon: Icon, label, color }, i) => (
                            <div
                                key={`${label}-${i}`}
                                className="flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.08] bg-white/[0.03] backdrop-blur-md flex-shrink-0"
                            >
                                <div
                                    className="w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0"
                                    style={{ backgroundColor: `${color}25` }}
                                >
                                    <Icon size={9} style={{ color }} strokeWidth={2.6} />
                                </div>
                                <span className="text-[11px] font-medium text-neutral-300">{label}</span>
                            </div>
                        ))}
                    </motion.div>
                </motion.div>

                {/* Sign-in Card */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35, duration: 0.6 }}
                    className="rounded-[28px] bg-[#0E132A]/90 backdrop-blur-xl border border-white/[0.1] shadow-[0_16px_40px_rgba(0,0,0,0.5)] p-5 sm:p-6 space-y-4"
                >
                    {/* Mode Segmented Toggle: Sign In vs Create Account */}
                    <div className="grid grid-cols-2 p-1 rounded-xl bg-white/[0.06] border border-white/10 text-xs font-semibold">
                        <button
                            type="button"
                            onClick={() => {
                                setIsSignUp(false);
                                setError(null);
                            }}
                            className={`py-2 rounded-lg transition-all ${
                                !isSignUp
                                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold"
                                    : "text-neutral-400 hover:text-white"
                            }`}
                        >
                            Sign In
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setIsSignUp(true);
                                setError(null);
                            }}
                            className={`py-2 rounded-lg transition-all ${
                                isSignUp
                                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold"
                                    : "text-neutral-400 hover:text-white"
                            }`}
                        >
                            Create Account
                        </button>
                    </div>

                    {/* Email & Password Form */}
                    <form onSubmit={handleCredentialsSubmit} className="space-y-3 pt-1">
                        <AnimatePresence>
                            {isSignUp && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden space-y-1.5"
                                >
                                    <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider block">
                                        Your Name
                                    </label>
                                    <div className="relative flex items-center">
                                        <User size={15} className="absolute left-3.5 text-neutral-500 pointer-events-none" />
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Your name"
                                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Email Input */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider block">
                                Email Address
                            </label>
                            <div className="relative flex items-center">
                                <Mail size={15} className="absolute left-3.5 text-neutral-500 pointer-events-none" />
                                <input
                                    type="email"
                                    required
                                    autoComplete="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="yourname@gmail.com"
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider block">
                                Password
                            </label>
                            <div className="relative flex items-center">
                                <Lock size={15} className="absolute left-3.5 text-neutral-500 pointer-events-none" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    autoComplete={isSignUp ? "new-password" : "current-password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 text-neutral-400 hover:text-white transition-colors"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {isSignUp && (
                                <p className="text-[10px] text-neutral-400 pt-0.5">
                                    Must be at least 6 characters
                                </p>
                            )}
                        </div>

                        {/* Error Alert */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-start gap-2 p-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs"
                            >
                                <AlertCircle size={15} className="flex-shrink-0 mt-0.5 text-red-400" />
                                <span className="leading-tight">{error}</span>
                            </motion.div>
                        )}

                        {/* Primary Submit Button */}
                        <motion.button
                            type="submit"
                            disabled={isLoading || isGoogleLoading}
                            whileTap={{ scale: 0.98 }}
                            className="w-full mt-2 relative flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-bold shadow-lg shadow-blue-500/25 transition-all disabled:opacity-70 cursor-pointer"
                        >
                            {isLoading ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <>
                                    <span>{isSignUp ? "Create Floww Account" : "Sign In to Floww"}</span>
                                    <ArrowRight size={15} />
                                </>
                            )}
                        </motion.button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-3 pt-1">
                        <div className="flex-1 h-px bg-white/10" />
                        <span className="text-[11px] text-neutral-400 font-semibold uppercase tracking-wider">
                            or
                        </span>
                        <div className="flex-1 h-px bg-white/10" />
                    </div>

                    {/* Google Sign-in Action */}
                    <motion.button
                        type="button"
                        onClick={handleGoogleSignIn}
                        disabled={isLoading || isGoogleLoading}
                        whileTap={{ scale: 0.98 }}
                        className="w-full relative flex items-center justify-center gap-3 py-3 rounded-xl bg-white text-neutral-900 text-sm font-bold shadow-md hover:bg-neutral-100 transition-colors disabled:opacity-70 cursor-pointer"
                    >
                        {isGoogleLoading ? (
                            <div className="w-4 h-4 border-2 border-neutral-300 border-t-neutral-800 rounded-full animate-spin" />
                        ) : (
                            <svg viewBox="0 0 24 24" width="18" height="18" className="flex-shrink-0">
                                <path fill="#EA4335" d="M5.27 9.76A7.08 7.08 0 0 1 12 4.9c1.76 0 3.35.64 4.59 1.7l3.41-3.4A11.95 11.95 0 0 0 12 1C8.08 1 4.67 3.01 2.73 6.02l2.54 3.74z" />
                                <path fill="#34A853" d="M16.04 18.01A7.07 7.07 0 0 1 12 19.1c-2.9 0-5.4-1.74-6.59-4.28l-2.68 3.92A11.95 11.95 0 0 0 12 23c3.2 0 6.13-1.17 8.35-3.1l-4.31-1.89z" />
                                <path fill="#FBBC05" d="M5.41 14.82A7.12 7.12 0 0 1 4.9 12c0-.99.19-1.95.52-2.84L2.73 5.42A11.93 11.93 0 0 0 1 12c0 2.34.67 4.52 1.84 6.38l2.57-3.56z" />
                                <path fill="#4285F4" d="M23 12.24c0-.77-.07-1.52-.19-2.24H12v4.24h6.18a5.26 5.26 0 0 1-2.28 3.44l4.31 1.89C21.94 17.71 23 15.14 23 12.24z" />
                            </svg>
                        )}
                        <span>{isGoogleLoading ? "Connecting..." : "Continue with Google"}</span>
                    </motion.button>

                    {/* Highlights bullet points */}
                    <div className="pt-2 border-t border-white/[0.08] space-y-1.5">
                        {highlights.slice(0, 2).map((text) => (
                            <div key={text} className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full bg-blue-500/15 flex items-center justify-center flex-shrink-0 text-blue-400">
                                    <Check size={9} strokeWidth={3} />
                                </div>
                                <span className="text-[11px] text-neutral-400 font-medium leading-snug">{text}</span>
                            </div>
                        ))}
                    </div>

                    {/* Security Footnote */}
                    <div className="flex items-center justify-center gap-1.5 text-neutral-400 text-[11px] pt-1">
                        <Lock size={11} className="text-emerald-400" />
                        <span>Encrypted Firebase Cloud Ledger · 100% Private</span>
                    </div>
                </motion.div>
            </main>

            {/* ─── Legal Footer ────────────────────────────────────── */}
            <footer className="relative z-10 w-full py-4 text-center text-xs text-neutral-500 max-w-md mx-auto space-y-1 px-4">
                <div className="flex items-center justify-center gap-3 font-medium">
                    <Link href="/privacy" className="hover:text-neutral-300 transition-colors">
                        Privacy Policy
                    </Link>
                    <span>•</span>
                    <Link href="/terms" className="hover:text-neutral-300 transition-colors">
                        Terms of Service
                    </Link>
                </div>
                <p className="text-[10px] text-neutral-600">
                    © {new Date().getFullYear()} Floww. All rights reserved.
                </p>
            </footer>
        </div>
    );
}
