"use client";

import { signIn } from "next-auth/react";
import { motion, useMotionValue, useSpring, AnimatePresence } from "framer-motion";
import { Camera, Brain, PieChart, Shield, TrendingUp, Sparkles, ArrowRight, Check } from "lucide-react";
import { useState, useEffect, useRef } from "react";

const features = [
    { icon: Camera, label: "AI Receipt Scanner", color: "#007AFF" },
    { icon: Brain, label: "AI Finance Coach", color: "#FF9F0A" },
    { icon: PieChart, label: "Smart Budgets", color: "#34C759" },
    { icon: TrendingUp, label: "Income Tracking", color: "#30D158" },
    { icon: Sparkles, label: "Agent Floww AI Chat", color: "#5856D6" },
    { icon: Shield, label: "Bank Statement Import", color: "#5AC8FA" },
];

const stats = [
    { value: "100%", label: "Free to use" },
    { value: "AI", label: "Powered" },
    { value: "0", label: "Ads ever" },
    { value: "∞", label: "Expense tracking" },
];

const taglines = [
    "Think smarter about money.",
    "Track every rupee effortlessly.",
    "Scan receipts. Import statements.",
    "Your AI finance assistant — Floww.",
];

const highlights = [
    "Track expenses and income in one place",
    "AI scans receipts & bank statements",
    "Smart budget alerts by category",
    "Agent Floww: your AI finance chatbot",
    "Privacy mode for public use",
];

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [taglineIdx, setTaglineIdx] = useState(0);
    const [displayed, setDisplayed] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const tickerRef = useRef<HTMLDivElement>(null);

    // Typewriter effect
    useEffect(() => {
        const current = taglines[taglineIdx];
        let timeout: ReturnType<typeof setTimeout>;

        if (!isDeleting && displayed.length < current.length) {
            timeout = setTimeout(() => setDisplayed(current.slice(0, displayed.length + 1)), 60);
        } else if (!isDeleting && displayed.length === current.length) {
            timeout = setTimeout(() => setIsDeleting(true), 2200);
        } else if (isDeleting && displayed.length > 0) {
            timeout = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 30);
        } else if (isDeleting && displayed.length === 0) {
            setIsDeleting(false);
            setTaglineIdx((prev) => (prev + 1) % taglines.length);
        }
        return () => clearTimeout(timeout);
    }, [displayed, isDeleting, taglineIdx]);

    const handleSignIn = () => {
        setIsLoading(true);
        signIn("google", { callbackUrl: "/" });
    };

    return (
        <div className="min-h-dvh relative overflow-hidden bg-[#050714]">

            {/* ─── Animated Background ─────────────────────────── */}
            <div className="fixed inset-0">
                {/* Deep static gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#050714] via-[#0a0f2e] to-[#06081a]" />

                {/* Animated mesh orbs */}
                <motion.div
                    className="absolute top-[-20%] left-[-10%] w-[700px] h-[700px] rounded-full"
                    style={{ background: "radial-gradient(circle, rgba(0,122,255,0.18) 0%, transparent 65%)" }}
                    animate={{ x: [0, 40, 0], y: [0, -30, 0], scale: [1, 1.05, 1] }}
                    transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                    className="absolute bottom-[-20%] right-[-10%] w-[700px] h-[700px] rounded-full"
                    style={{ background: "radial-gradient(circle, rgba(88,86,214,0.2) 0%, transparent 65%)" }}
                    animate={{ x: [0, -30, 0], y: [0, 20, 0], scale: [1, 1.08, 1] }}
                    transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                    className="absolute top-[30%] right-[-5%] w-[400px] h-[400px] rounded-full"
                    style={{ background: "radial-gradient(circle, rgba(255,159,10,0.12) 0%, transparent 65%)" }}
                    animate={{ x: [0, 20, 0], y: [0, -30, 0] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* Fine grid */}
                <div
                    className="absolute inset-0 opacity-[0.025]"
                    style={{
                        backgroundImage: `linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)`,
                        backgroundSize: "48px 48px",
                    }}
                />

                {/* Noise texture */}
                <div
                    className="absolute inset-0 opacity-[0.04]"
                    style={{
                        backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
                    }}
                />
            </div>

            {/* ─── Page Content ─────────────────────────────────── */}
            <div className="relative z-10 min-h-dvh flex flex-col items-center justify-center px-5 py-8">
                <div className="w-full max-w-[420px] flex flex-col gap-7">

                    {/* ── Logo & Brand ─────────────────────────── */}
                    <motion.div
                        initial={{ opacity: 0, y: -24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ type: "spring", duration: 0.9 }}
                        className="flex flex-col items-center gap-4"
                    >
                        {/* Logo */}
                        <div className="relative">
                            <motion.div
                                className="absolute inset-0 rounded-[28px]"
                                style={{ background: "rgba(0,122,255,0.35)", filter: "blur(20px)" }}
                                animate={{ opacity: [0.5, 0.9, 0.5] }}
                                transition={{ duration: 3, repeat: Infinity }}
                            />
                            <motion.div
                                className="relative w-[88px] h-[88px] rounded-[28px] overflow-hidden ring-1 ring-white/10 shadow-2xl"
                                animate={{ rotateY: [0, 6, -6, 0] }}
                                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <img src="/logo.png?v=3" alt="Floww" className="w-full h-full object-contain p-1" />
                            </motion.div>
                        </div>

                        {/* App name */}
                        <div className="text-center">
                            <h1 className="text-[40px] font-black text-white tracking-tight leading-none">Floww</h1>
                            <p className="text-[11px] font-semibold text-white/35 tracking-[0.2em] uppercase mt-1">Document Intelligence Platform</p>
                        </div>

                        {/* Typewriter tagline */}
                        <div className="h-7 flex items-center justify-center">
                            <p className="text-[15px] font-medium text-white/60 text-center">
                                {displayed}
                                <motion.span
                                    animate={{ opacity: [1, 0, 1] }}
                                    transition={{ duration: 0.8, repeat: Infinity }}
                                    className="inline-block w-[2px] h-[15px] bg-blue-400 ml-[2px] align-middle rounded-full"
                                />
                            </p>
                        </div>
                    </motion.div>

                    {/* ── Stats Row ───────────────────────────── */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="grid grid-cols-4 gap-2"
                    >
                        {stats.map(({ value, label }, i) => (
                            <motion.div
                                key={label}
                                initial={{ opacity: 0, scale: 0.85 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.35 + i * 0.07, type: "spring" }}
                                className="flex flex-col items-center py-3 px-1 rounded-2xl bg-white/[0.035] border border-white/[0.06] backdrop-blur-sm"
                            >
                                <span className="text-[18px] font-black text-white">{value}</span>
                                <span className="text-[9px] text-white/35 font-medium text-center leading-tight mt-0.5">{label}</span>
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* ── Scrolling Feature Ticker ─────────────── */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="relative overflow-hidden"
                    >
                        {/* Left fade */}
                        <div className="absolute left-0 top-0 bottom-0 w-8 z-10 bg-gradient-to-r from-[#050714] to-transparent pointer-events-none" />
                        {/* Right fade */}
                        <div className="absolute right-0 top-0 bottom-0 w-8 z-10 bg-gradient-to-l from-[#050714] to-transparent pointer-events-none" />

                        <motion.div
                            className="flex gap-3 w-max"
                            animate={{ x: ["0%", "-50%"] }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        >
                            {[...features, ...features].map(({ icon: Icon, label, color }, i) => (
                                <div
                                    key={`${label}-${i}`}
                                    className="flex items-center gap-2 px-3.5 py-2 rounded-full border border-white/[0.07] bg-white/[0.03] backdrop-blur-sm flex-shrink-0"
                                >
                                    <div
                                        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                                        style={{ backgroundColor: `${color}20` }}
                                    >
                                        <Icon size={11} style={{ color }} strokeWidth={2.5} />
                                    </div>
                                    <span className="text-[12px] font-medium text-white/55 whitespace-nowrap">{label}</span>
                                </div>
                            ))}
                        </motion.div>
                    </motion.div>

                    {/* ── Sign-in Card ─────────────────────────── */}
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.65, type: "spring", stiffness: 180 }}
                        className="relative rounded-3xl overflow-hidden"
                    >
                        {/* Card border glow */}
                        <div
                            className="absolute inset-0 rounded-3xl"
                            style={{
                                background: "linear-gradient(135deg, rgba(0,122,255,0.25) 0%, rgba(88,86,214,0.12) 50%, rgba(0,0,0,0) 100%)",
                                padding: "1px",
                            }}
                        >
                            <div className="absolute inset-[1px] rounded-[23px] bg-[#0d1230]/90 backdrop-blur-xl" />
                        </div>

                        <div className="relative z-10 p-6 space-y-5">
                            {/* Highlights list */}
                            <div className="space-y-2.5">
                                {highlights.map((text, i) => (
                                    <motion.div
                                        key={text}
                                        initial={{ opacity: 0, x: -12 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.75 + i * 0.07 }}
                                        className="flex items-center gap-3"
                                    >
                                        <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                                            <Check size={11} className="text-blue-400" strokeWidth={3} />
                                        </div>
                                        <span className="text-[13px] text-white/60 font-medium">{text}</span>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Divider */}
                            <div className="h-px bg-white/[0.06]" />

                            {/* Google Sign-in Button */}
                            <motion.button
                                onClick={handleSignIn}
                                disabled={isLoading}
                                whileTap={{ scale: 0.97 }}
                                className="w-full relative flex items-center justify-center gap-3 py-4 rounded-2xl bg-white text-slate-900 text-[15px] font-bold shadow-xl shadow-blue-500/10 overflow-hidden group disabled:opacity-70"
                            >
                                {/* Shimmer sweep on hover */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-200%] group-hover:translate-x-[250%] transition-transform duration-700" />

                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin" />
                                ) : (
                                    <svg viewBox="0 0 24 24" width="20" height="20" className="flex-shrink-0">
                                        <path fill="#EA4335" d="M5.27 9.76A7.08 7.08 0 0 1 12 4.9c1.76 0 3.35.64 4.59 1.7l3.41-3.4A11.95 11.95 0 0 0 12 1C8.08 1 4.67 3.01 2.73 6.02l2.54 3.74z" />
                                        <path fill="#34A853" d="M16.04 18.01A7.07 7.07 0 0 1 12 19.1c-2.9 0-5.4-1.74-6.59-4.28l-2.68 3.92A11.95 11.95 0 0 0 12 23c3.2 0 6.13-1.17 8.35-3.1l-4.31-1.89z" />
                                        <path fill="#FBBC05" d="M5.41 14.82A7.12 7.12 0 0 1 4.9 12c0-.99.19-1.95.52-2.84L2.73 5.42A11.93 11.93 0 0 0 1 12c0 2.34.67 4.52 1.84 6.38l2.57-3.56z" />
                                        <path fill="#4285F4" d="M23 12.24c0-.77-.07-1.52-.19-2.24H12v4.24h6.18a5.26 5.26 0 0 1-2.28 3.44l4.31 1.89C21.94 17.71 23 15.14 23 12.24z" />
                                    </svg>
                                )}
                                <span>{isLoading ? "Connecting..." : "Continue with Google"}</span>
                                {!isLoading && <ArrowRight size={16} className="text-slate-400 group-hover:translate-x-1 transition-transform" />}
                            </motion.button>

                            {/* Trust + Legal */}
                            <div className="space-y-2 text-center">
                                <p className="flex items-center justify-center gap-1.5 text-white/25 text-[11px]">
                                    <Shield size={10} />
                                    <span>End-to-end secure · No passwords</span>
                                </p>
                                <p className="flex items-center justify-center gap-2 text-white/25 text-[10px]">
                                    <a href="/privacy" target="_blank" rel="noopener noreferrer" className="hover:text-white/50 underline underline-offset-2 transition-colors">Privacy Policy</a>
                                    <span>·</span>
                                    <a href="/terms" target="_blank" rel="noopener noreferrer" className="hover:text-white/50 underline underline-offset-2 transition-colors">Terms of Service</a>
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
