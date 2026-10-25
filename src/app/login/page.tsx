"use client";

import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
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
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
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

    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        setErrorMessage(null);

        try {
            // Check if running inside native Android / iOS Capacitor app
            const capacitor = typeof window !== "undefined" ? (window as any).Capacitor : null;
            const isNative = capacitor && typeof capacitor.isNativePlatform === "function" && capacitor.isNativePlatform();
            const nativeGoogleAuth = capacitor?.Plugins?.NativeGoogleAuth;

            if (isNative && nativeGoogleAuth) {
                // 1-Tap native Android Google Play Services account picker
                const googleAccount = await nativeGoogleAuth.signIn({
                    serverClientId: "902896742960-sfp6ifpgq0jdp7522rc5ja6qhkrnqn3u.apps.googleusercontent.com",
                });

                if (googleAccount?.email) {
                    const res = await signIn("google-native", {
                        redirect: false,
                        email: googleAccount.email,
                        name: googleAccount.name,
                        image: googleAccount.imageUrl,
                        idToken: googleAccount.idToken,
                        callbackUrl: "/",
                    });

                    if (res?.ok) {
                        window.location.href = "/";
                        return;
                    } else if (res?.error) {
                        setErrorMessage(res.error);
                        setIsLoading(false);
                        return;
                    }
                }
            }

            // Web browser fallback
            await signIn("google", { callbackUrl: "/" });
        } catch (err: any) {
            console.error("Sign in error:", err);
            // If user closed account picker dialog, simply reset loading
            if (err?.message?.includes("cancelled") || err?.message?.includes("12501")) {
                setIsLoading(false);
                return;
            }
            // If native plugin not ready, fallback to web OAuth
            try {
                await signIn("google", { callbackUrl: "/" });
            } catch (fallbackErr) {
                setErrorMessage("Unable to complete sign-in. Please try again.");
                setIsLoading(false);
            }
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

            {/* ─── Main Center Container: Perfectly Centered ───────── */}
            <main className="relative z-10 flex-1 flex flex-col items-center justify-center w-full max-w-[430px] mx-auto px-5 py-8 sm:py-12">
                <div className="w-full flex flex-col gap-5 sm:gap-6">

                    {/* Brand Hero */}
                    <motion.div
                        initial={{ opacity: 0, y: -14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="flex flex-col items-center text-center gap-2"
                    >
                        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                            Welcome to Floww
                        </h1>
                        <div className="h-6 flex items-center justify-center">
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
                        transition={{ delay: 0.15 }}
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
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25, duration: 0.5 }}
                        className="rounded-[28px] bg-[#0E132A]/90 backdrop-blur-xl border border-white/[0.1] shadow-[0_20px_50px_rgba(0,0,0,0.6)] p-6 sm:p-7 space-y-5"
                    >
                        {/* Benefits List */}
                        <div className="space-y-2.5">
                            {highlights.map((text) => (
                                <div key={text} className="flex items-center gap-2.5">
                                    <div className="w-5 h-5 rounded-full bg-blue-500/15 flex items-center justify-center flex-shrink-0 text-blue-400">
                                        <Check size={11} strokeWidth={3} />
                                    </div>
                                    <span className="text-[12.5px] text-neutral-300 font-medium leading-snug">{text}</span>
                                </div>
                            ))}
                        </div>

                        <div className="h-px bg-white/[0.08]" />

                        {/* Error Banner if any */}
                        {errorMessage && (
                            <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-300 text-center">
                                {errorMessage}
                            </div>
                        )}

                        {/* Quick 1-Tap Google Sign-in Action */}
                        <motion.button
                            type="button"
                            onClick={handleGoogleSignIn}
                            disabled={isLoading}
                            whileTap={{ scale: 0.98 }}
                            className="w-full relative flex items-center justify-center gap-3 py-3.5 rounded-2xl bg-white text-neutral-900 text-[15px] font-bold shadow-xl shadow-blue-500/10 hover:bg-neutral-100 transition-colors disabled:opacity-70 group cursor-pointer"
                        >
                            {isLoading ? (
                                <Loader2 size={20} className="animate-spin text-neutral-800" />
                            ) : (
                                <svg viewBox="0 0 24 24" width="20" height="20" className="flex-shrink-0">
                                    <path fill="#EA4335" d="M5.27 9.76A7.08 7.08 0 0 1 12 4.9c1.76 0 3.35.64 4.59 1.7l3.41-3.4A11.95 11.95 0 0 0 12 1C8.08 1 4.67 3.01 2.73 6.02l2.54 3.74z" />
                                    <path fill="#34A853" d="M16.04 18.01A7.07 7.07 0 0 1 12 19.1c-2.9 0-5.4-1.74-6.59-4.28l-2.68 3.92A11.95 11.95 0 0 0 12 23c3.2 0 6.13-1.17 8.35-3.1l-4.31-1.89z" />
                                    <path fill="#FBBC05" d="M5.41 14.82A7.12 7.12 0 0 1 4.9 12c0-.99.19-1.95.52-2.84L2.73 5.42A11.93 11.93 0 0 0 1 12c0 2.34.67 4.52 1.84 6.38l2.57-3.56z" />
                                    <path fill="#4285F4" d="M23 12.24c0-.77-.07-1.52-.19-2.24H12v4.24h6.18a5.26 5.26 0 0 1-2.28 3.44l4.31 1.89C21.94 17.71 23 15.14 23 12.24z" />
                                </svg>
                            )}
                            <span>{isLoading ? "Signing in..." : "Continue with Google"}</span>
                            {!isLoading && (
                                <ArrowRight size={16} className="text-neutral-400 group-hover:translate-x-1 transition-transform" />
                            )}
                        </motion.button>

                        {/* Security Footnote */}
                        <div className="flex items-center justify-center gap-1.5 text-neutral-400 text-[11px] pt-0.5">
                            <Lock size={11} className="text-emerald-400" />
                            <span>1-Tap Google Account Sign-In · 100% Private</span>
                        </div>
                    </motion.div>
                </div>
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
