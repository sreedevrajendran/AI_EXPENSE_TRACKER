"use client";

import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { Sparkles, Brain, Mail, Camera, PieChart, Shield, TrendingUp } from "lucide-react";
import { useState } from "react";

const features = [
    {
        icon: Camera,
        title: "AI Receipt Scanner",
        desc: "Snap a photo — AI extracts amount, merchant & category instantly",
        color: "#007AFF",
        gradient: "from-blue-500/20 to-cyan-500/20",
    },
    {
        icon: Mail,
        title: "Gmail Auto-Sync",
        desc: "AI reads your emails to find & log transactions automatically",
        color: "#5856D6",
        gradient: "from-violet-500/20 to-purple-500/20",
    },
    {
        icon: Brain,
        title: "AI Finance Coach",
        desc: "Get personalized spending insights & a financial health score",
        color: "#FF9F0A",
        gradient: "from-amber-500/20 to-orange-500/20",
    },
    {
        icon: PieChart,
        title: "Smart Budgets",
        desc: "Set category budgets with real-time tracking & visual progress",
        color: "#34C759",
        gradient: "from-green-500/20 to-emerald-500/20",
    },
    {
        icon: Shield,
        title: "Privacy Mode",
        desc: "Blur all amounts with one tap — perfect for public use",
        color: "#FF2D55",
        gradient: "from-pink-500/20 to-rose-500/20",
    },
    {
        icon: TrendingUp,
        title: "Income & Expense Charts",
        desc: "Beautiful visual breakdowns of where your money goes",
        color: "#5AC8FA",
        gradient: "from-sky-500/20 to-blue-500/20",
    },
];

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);

    const handleSignIn = () => {
        setIsLoading(true);
        signIn("google", { callbackUrl: "/" });
    };

    return (
        <div className="min-h-dvh relative overflow-hidden">
            {/* Animated Background */}
            <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950" />

            {/* Floating Orbs */}
            <motion.div
                className="fixed top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full opacity-30"
                style={{ background: "radial-gradient(circle, rgba(0,122,255,0.4) 0%, transparent 70%)" }}
                animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
                className="fixed bottom-[-15%] right-[-10%] w-[600px] h-[600px] rounded-full opacity-25"
                style={{ background: "radial-gradient(circle, rgba(88,86,214,0.5) 0%, transparent 70%)" }}
                animate={{ x: [0, -25, 0], y: [0, 15, 0] }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
                className="fixed top-[40%] right-[10%] w-[300px] h-[300px] rounded-full opacity-20"
                style={{ background: "radial-gradient(circle, rgba(52,199,89,0.4) 0%, transparent 70%)" }}
                animate={{ x: [0, 15, 0], y: [0, 25, 0] }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Grid Pattern Overlay */}
            <div
                className="fixed inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                    backgroundSize: "60px 60px",
                }}
            />

            {/* Content */}
            <div className="relative z-10 min-h-dvh flex flex-col items-center justify-center px-5 py-6 safe-top safe-bottom">
                <div className="w-full max-w-md space-y-6">

                    {/* Logo & Branding */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ type: "spring", duration: 0.8 }}
                        className="flex flex-col items-center gap-3"
                    >
                        {/* Logo with glow effect */}
                        <div className="relative">
                            <div className="absolute inset-0 w-20 h-20 rounded-[24px] bg-blue-500/30 blur-2xl" />
                            <motion.div
                                className="relative w-20 h-20 rounded-[24px] overflow-hidden shadow-2xl ring-1 ring-white/10"
                                animate={{ rotateY: [0, 5, -5, 0] }}
                                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <img src="/logo.png?v=2" alt="Oasis Logo" className="w-full h-full object-cover" />
                            </motion.div>
                        </div>

                        <div className="text-center space-y-1">
                            <h1 className="text-3xl font-bold text-white tracking-tight">
                                Oasis
                            </h1>
                            <p className="text-xs font-medium text-white/50 tracking-widest uppercase">
                                AI Expense Tracker
                            </p>
                        </div>

                        {/* Tagline */}
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="text-sm text-white/60 text-center max-w-xs leading-relaxed"
                        >
                            Your AI-powered financial companion that <span className="text-white/90 font-medium">thinks</span>, <span className="text-white/90 font-medium">learns</span>, and <span className="text-white/90 font-medium">protects</span>.
                        </motion.p>
                    </motion.div>

                    {/* Feature Cards — 2 Column Grid */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="grid grid-cols-2 gap-2.5"
                    >
                        {features.map(({ icon: Icon, title, desc, color, gradient }, i) => (
                            <motion.div
                                key={title}
                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ delay: 0.4 + i * 0.08, type: "spring", stiffness: 200 }}
                                className={`relative group p-3 rounded-2xl bg-gradient-to-br ${gradient} backdrop-blur-sm border border-white/[0.06] hover:border-white/[0.12] transition-all duration-300`}
                            >
                                <div
                                    className="w-8 h-8 rounded-lg flex items-center justify-center mb-2"
                                    style={{ backgroundColor: `${color}25` }}
                                >
                                    <Icon size={16} style={{ color }} strokeWidth={2.2} />
                                </div>
                                <h3 className="text-[12px] font-bold text-white/90 mb-0.5 leading-tight">{title}</h3>
                                <p className="text-[10px] text-white/40 leading-snug">{desc}</p>
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* Sign In Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.9 }}
                        className="space-y-3"
                    >
                        <button
                            onClick={handleSignIn}
                            disabled={isLoading}
                            className="w-full relative flex items-center justify-center gap-3 py-3.5 rounded-2xl bg-white text-slate-900 text-[15px] font-bold shadow-lg shadow-white/10 active:scale-[0.97] transition-all duration-200 disabled:opacity-70 overflow-hidden group"
                        >
                            {/* Shimmer effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />

                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-slate-400 border-t-slate-800 rounded-full animate-spin" />
                            ) : (
                                <svg viewBox="0 0 24 24" width="20" height="20">
                                    <path fill="#EA4335" d="M5.27 9.76A7.08 7.08 0 0 1 12 4.9c1.76 0 3.35.64 4.59 1.7l3.41-3.4A11.95 11.95 0 0 0 12 1C8.08 1 4.67 3.01 2.73 6.02l2.54 3.74z" />
                                    <path fill="#34A853" d="M16.04 18.01A7.07 7.07 0 0 1 12 19.1c-2.9 0-5.4-1.74-6.59-4.28l-2.68 3.92A11.95 11.95 0 0 0 12 23c3.2 0 6.13-1.17 8.35-3.1l-4.31-1.89z" />
                                    <path fill="#FBBC05" d="M5.41 14.82A7.12 7.12 0 0 1 4.9 12c0-.99.19-1.95.52-2.84L2.73 5.42A11.93 11.93 0 0 0 1 12c0 2.34.67 4.52 1.84 6.38l2.57-3.56z" />
                                    <path fill="#4285F4" d="M23 12.24c0-.77-.07-1.52-.19-2.24H12v4.24h6.18a5.26 5.26 0 0 1-2.28 3.44l4.31 1.89C21.94 17.71 23 15.14 23 12.24z" />
                                </svg>
                            )}
                            {isLoading ? "Connecting..." : "Continue with Google"}
                        </button>

                        {/* Trust badge */}
                        <p className="flex items-center justify-center gap-1.5 text-white/30 text-[11px]">
                            <Shield size={11} /> End-to-end Secure
                        </p>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
