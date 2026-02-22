"use client";

import { useSession, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { usePrivacy } from "@/context/PrivacyContext";
import { motion } from "framer-motion";
import Image from "next/image";
import { Suspense, useEffect, useState } from "react";
import { trpc } from "@/trpc/client";
import { Eye, EyeOff, Moon, Sun, LogOut, Check, Shield, Mail } from "lucide-react";
import toast from "react-hot-toast";
import { useSearchParams } from "next/navigation";

function SettingsContent() {
    const { data: session } = useSession();
    const { theme, setTheme } = useTheme();
    const { isPrivate, togglePrivacy } = usePrivacy();
    const searchParams = useSearchParams();
    const [mounted, setMounted] = useState(false);

    // Fetch Gmail connection status
    const { data: gmailStatus, refetch: refetchGmailStatus } = trpc.gmail.getStatus.useQuery(undefined, {
        enabled: mounted && !!session?.user
    });

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (searchParams?.get("gmail_connected") === "true") {
            toast.success("Gmail connected successfully for AI Sync!");
            refetchGmailStatus();
        } else if (searchParams?.get("error")) {
            toast.error("Failed to connect Gmail. Please try again.");
        }
    }, [searchParams, refetchGmailStatus]);

    const user = session?.user;

    if (!mounted) return null;

    return (
        <div className="px-4 pt-4 pb-6 space-y-5">
            {/* Profile Card */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="ios-card p-4 flex items-center gap-4"
            >
                <div className="relative w-14 h-14 rounded-full overflow-hidden bg-ios-blue ring-2 ring-ios-blue/30">
                    {user?.image ? (
                        <Image src={user.image} alt={user.name ?? "User"} fill className="object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold">
                            {user?.name?.charAt(0) ?? "?"}
                        </div>
                    )}
                </div>
                <div className="flex-1">
                    <p className="text-[17px] font-semibold ios-text-primary">{user?.name ?? "User"}</p>
                    <p className="text-sm ios-text-secondary">{user?.email}</p>
                </div>
            </motion.div>

            {/* Preferences */}
            <div>
                <p className="text-xs font-semibold ios-text-secondary uppercase tracking-wider mb-2 px-1">Preferences</p>
                <div className="ios-card overflow-hidden divide-y ios-separator">
                    {/* Privacy toggle */}
                    <div className="flex items-center justify-between px-4 py-3.5">
                        <div className="flex items-center gap-3">
                            {isPrivate ? <EyeOff size={20} className="text-ios-blue dark:text-ios-blue-dark" /> : <Eye size={20} className="text-ios-blue dark:text-ios-blue-dark" />}
                            <div>
                                <p className="text-[15px] ios-text-primary font-medium">Privacy Mode</p>
                                <p className="text-xs ios-text-secondary">Blur balances and amounts</p>
                            </div>
                        </div>
                        <button
                            onClick={togglePrivacy}
                            className={`relative w-12 h-7 rounded-full transition-colors duration-300 ${isPrivate ? "bg-ios-blue dark:bg-ios-blue-dark" : "bg-[#E5E5EA] dark:bg-[#3A3A3C]"}`}
                        >
                            <motion.div
                                className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow"
                                animate={{ x: isPrivate ? 22 : 2 }}
                                transition={{ type: "spring", stiffness: 700, damping: 35 }}
                            />
                        </button>
                    </div>

                    {/* Dark mode */}
                    <div className="flex items-center justify-between px-4 py-3.5">
                        <div className="flex items-center gap-3">
                            {theme === "dark" ? <Moon size={20} className="text-ios-indigo" /> : <Sun size={20} className="text-ios-yellow" />}
                            <div>
                                <p className="text-[15px] ios-text-primary font-medium">Dark Mode</p>
                                <p className="text-xs ios-text-secondary">{theme === "dark" ? "Pure black theme" : "Pure white theme"}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                            className={`relative w-12 h-7 rounded-full transition-colors duration-300 ${theme === "dark" ? "bg-ios-blue dark:bg-ios-blue-dark" : "bg-[#E5E5EA] dark:bg-[#3A3A3C]"}`}
                        >
                            <motion.div
                                className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow"
                                animate={{ x: theme === "dark" ? 22 : 2 }}
                                transition={{ type: "spring", stiffness: 700, damping: 35 }}
                            />
                        </button>
                    </div>
                </div>
            </div>

            {/* Integrations */}
            <div>
                <p className="text-xs font-semibold ios-text-secondary uppercase tracking-wider mb-2 px-1">Integrations</p>
                <div className="ios-card overflow-hidden divide-y ios-separator">
                    <div className="flex items-center justify-between px-4 py-3.5">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#EA4335]/10 flex items-center justify-center">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-[15px] ios-text-primary font-medium">Google Workspace</p>
                                <p className="text-xs ios-text-secondary">Sync receipts via Gmail</p>
                            </div>
                        </div>
                        {gmailStatus?.isConnected ? (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#34C759]/10 dark:bg-[#32D74B]/15 text-[#34C759] dark:text-[#32D74B] text-[13px] font-medium rounded-full">
                                <Check size={14} strokeWidth={3} />
                                Connected
                            </div>
                        ) : (
                            <a
                                href="/api/gmail/auth"
                                className="px-3 py-1.5 bg-ios-blue/10 dark:bg-ios-blue-dark/20 text-ios-blue dark:text-ios-blue-dark text-[13px] font-medium rounded-full active:opacity-70 transition-opacity"
                            >
                                Connect
                            </a>
                        )}
                    </div>
                </div>
            </div>

            {/* Account */}
            <div>
                <p className="text-xs font-semibold ios-text-secondary uppercase tracking-wider mb-2 px-1">Account</p>
                <div className="ios-card overflow-hidden divide-y ios-separator">
                    <button
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-[#F2F2F7] dark:active:bg-[#2C2C2E] transition-colors"
                    >
                        <LogOut size={20} className="text-ios-red" />
                        <p className="text-[15px] text-ios-red font-medium">Sign Out</p>
                    </button>
                </div>
            </div>

            {/* About Oasis */}
            <div className="pt-4">
                <p className="text-xs font-semibold ios-text-secondary uppercase tracking-wider mb-2 px-1">About Oasis</p>
                <div className="ios-card overflow-hidden">
                    <div className="p-5 flex flex-col items-center text-center space-y-3 border-b ios-separator">
                        <Image
                            src="/logo.png?v=2"
                            alt="Oasis Logo"
                            width={80}
                            height={80}
                            className="rounded-[20px] shadow-sm"
                            unoptimized
                        />
                        <div>
                            <h3 className="text-[19px] font-bold ios-text-primary tracking-tight">Oasis Expense Tracker</h3>
                            <p className="text-[13px] ios-text-secondary mt-0.5">Version 1.0.0</p>
                        </div>
                        <p className="text-[14px] leading-relaxed ios-text-primary px-2 pt-2">
                            Oasis is an intelligent personal finance manager built to give you total clarity over your spending habits. By combining manual tracking with smart AI insights and automated email receipt parsing, Oasis helps you stay on top of your budgets effortlessly.
                        </p>
                    </div>

                    <div className="divide-y ios-separator">
                        {/* Privacy Policy */}
                        <div className="p-5 space-y-3">
                            <div className="flex items-center gap-2 text-ios-blue dark:text-ios-blue-dark font-medium">
                                <Shield size={18} strokeWidth={2.5} />
                                <h4 className="text-[15px]">Privacy Policy</h4>
                            </div>
                            <div className="space-y-2 text-[13px] leading-relaxed ios-text-secondary">
                                <p>
                                    Your data is securely stored and private by default. Oasis does not share or sell your financial data to third parties.
                                </p>
                                <p>
                                    <strong>Gmail Sync:</strong> When you connect your Gmail account, Oasis only requests read-only access to parse digital receipts. We do not read personal communications, insert emails, or store copies of your emails. The AI parsing is done securely using our trusted LLM providers (Google Gemini / Groq Llama) strictly for extracting expense amounts, merchants, and dates.
                                </p>
                                <p>
                                    <strong>AI Chatbot:</strong> Conversations with Agent Oasis are restricted to your own financial context. Contextual data sent to the AI is transient and not used to train global models.
                                </p>
                            </div>
                        </div>

                        {/* Contact Support */}
                        <a
                            href="mailto:sreerajar40@gmail.com"
                            className="flex items-center justify-between px-5 py-4 active:bg-[#F2F2F7] dark:active:bg-[#2C2C2E] transition-colors group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-ios-blue/10 dark:bg-ios-blue-dark/20 flex items-center justify-center text-ios-blue dark:text-ios-blue-dark">
                                    <Mail size={16} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <p className="text-[15px] ios-text-primary font-medium">Contact Support</p>
                                    <p className="text-[13px] ios-text-secondary group-hover:text-ios-blue transition-colors">sreerajar40@gmail.com</p>
                                </div>
                            </div>
                        </a>
                    </div>
                </div>
            </div>

        </div>
    );
}

export default function SettingsPage() {
    return (
        <Suspense fallback={<div className="p-4 flex justify-center"><div className="w-5 h-5 border-2 border-ios-blue border-t-transparent rounded-full animate-spin" /></div>}>
            <SettingsContent />
        </Suspense>
    );
}
