"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { usePrivacy } from "@/context/PrivacyContext";
import { useCurrency } from "@/context/CurrencyContext";
import { motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";
import { trpc } from "@/trpc/client";
import {
    Eye,
    EyeOff,
    Moon,
    Sun,
    LogOut,
    Check,
    Shield,
    Database,
    Sparkles,
    Download,
    RefreshCw,
    Smartphone,
    Globe,
    Layers,
    ChevronRight,
    FileText,
    Sheet,
    Undo2,
    Trash2,
    AlertTriangle,
    Loader2,
    Bell,
} from "lucide-react";
import { showMatchingAlert } from "@/components/ui/AlertCard";
import { TransactionStatementModal } from "@/components/transactions/TransactionStatementModal";
import { requestNotificationPermission, sendNotification } from "@/lib/notifications";
import { AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
    const { data: session } = useSession();
    const { theme, setTheme } = useTheme();
    const { isPrivate, togglePrivacy } = usePrivacy();
    const { currency, setCurrency: setContextCurrency } = useCurrency();
    const [mounted, setMounted] = useState(false);
    const [rollbackModalOpen, setRollbackModalOpen] = useState(false);
    const [clearModalOpen, setClearModalOpen] = useState(false);
    const [statementFilterOpen, setStatementFilterOpen] = useState(false);

    const utils = trpc.useUtils();
    const { data: allExpenses } = trpc.expense.list.useQuery({ limit: 1000 });
    const { data: allIncomes } = trpc.income.list.useQuery({ limit: 1000 });
    const importInfoQuery = trpc.expense.getLastImportInfo.useQuery();
    const rollbackMutation = trpc.expense.rollbackLastImport.useMutation();
    const clearAllMutation = trpc.expense.clearAllTransactions.useMutation();

    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

    useEffect(() => {
        setMounted(true);
        if (typeof window !== "undefined") {
            const stored = localStorage.getItem("floww_reminders_enabled");
            setNotificationsEnabled(stored !== "false");
        }
    }, []);

    const toggleNotifications = async () => {
        const next = !notificationsEnabled;
        setNotificationsEnabled(next);
        if (typeof window !== "undefined") {
            localStorage.setItem("floww_reminders_enabled", String(next));
        }
        if (next) {
            const granted = await requestNotificationPermission();
            if (granted) {
                showMatchingAlert({
                    status: "success",
                    title: "Smart Reminders Enabled",
                    message: "You will receive timely ledger nudges & updates.",
                });
            }
        } else {
            showMatchingAlert({
                status: "info",
                title: "Reminders Disabled",
                message: "Push reminders have been turned off.",
            });
        }
    };

    const handleTestNotification = async () => {
        const userName = session?.user?.name?.split(" ")[0] || "there";
        await sendNotification({
            id: Math.floor(Date.now() % 100000000),
            scenario: "manual_test",
            title: `Hi ${userName} 👋`,
            body: "You haven't recorded any expenses or incomes yet today. Keep your ledger fresh!",
        });
        showMatchingAlert({
            status: "success",
            title: "Test Notification Dispatched",
            message: "Check your native notifications or top in-app banner.",
        });
    };

    const handleCurrencyChange = (newCurr: string) => {
        setContextCurrency(newCurr);
        showMatchingAlert({
            status: "success",
            title: "Currency Updated",
            message: `Display currency set to ${newCurr}`,
        });
    };

    const handleExportData = () => {
        try {
            const exportObj = {
                platform: "Floww Financial Intelligence",
                version: "2.0",
                exportDate: new Date().toISOString(),
                expenses: allExpenses || [],
                incomes: allIncomes || [],
            };
            const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `Floww_Financial_Data_Backup_${new Date().toISOString().split("T")[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showMatchingAlert({
                status: "success",
                title: "Backup Downloaded",
                message: "Your offline transaction archive has been safely saved.",
            });
        } catch {
            showMatchingAlert({
                status: "error",
                title: "Backup Export Failed",
                message: "Unable to export data archive. Please verify storage permissions and try again.",
            });
        }
    };

    const handleRollback = async () => {
        try {
            const res = await rollbackMutation.mutateAsync({
                batchId: importInfoQuery.data?.batchId || undefined,
            });
            await utils.invalidate();
            if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("app:transactions-updated"));
            }
            setRollbackModalOpen(false);
            showMatchingAlert({
                status: "success",
                title: "Statement Rolled Back",
                message: `Successfully removed ${res.totalDeleted} transactions. You can now redo and upload the correct PDF!`,
            });
        } catch (err) {
            console.error("Rollback error:", err);
            showMatchingAlert({
                status: "error",
                title: "Rollback Failed",
                message: "Could not remove statement transactions. Please try again.",
            });
        }
    };

    const handleClearAll = async () => {
        try {
            const res = await clearAllMutation.mutateAsync();
            await utils.invalidate();
            if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("app:transactions-updated"));
            }
            setClearModalOpen(false);
            showMatchingAlert({
                status: "success",
                title: "All Transactions Cleared",
                message: `Wiped ${res.totalDeleted} records. Your ledger is clean and ready for a fresh PDF statement!`,
            });
        } catch (err) {
            console.error("Clear all error:", err);
            showMatchingAlert({
                status: "error",
                title: "Reset Failed",
                message: "Could not clear transactions. Please try again.",
            });
        }
    };

    const triggerReUpload = () => {
        setRollbackModalOpen(false);
        setClearModalOpen(false);
        if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("app:open-action-sheet"));
        }
    };

    const user = session?.user;

    if (!mounted) return null;

    return (
        <div className="px-4 pt-4 pb-28 max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Settings</h1>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Preferences, account &amp; app version</p>
            </div>

            {/* Profile Card */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full rounded-[28px] bg-white dark:bg-[#1C1C1E] border border-neutral-200/80 dark:border-neutral-800 p-5 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)] flex items-center gap-4 relative overflow-hidden"
            >
                <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-gradient-to-tr from-ios-blue to-purple-600 flex items-center justify-center text-white text-2xl font-black shadow-md shadow-ios-blue/20 flex-shrink-0">
                    {user?.image ? (
                        <Image
                            src={user.image}
                            alt={user.name ?? "User"}
                            fill
                            className="object-cover"
                        />
                    ) : (
                        user?.name?.charAt(0) ?? "U"
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <p className="text-[17px] font-bold text-neutral-900 dark:text-white truncate">
                        {user?.name ?? "Account Holder"}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5">{user?.email ?? "account@floww.local"}</p>
                </div>

                <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    title="Log Out"
                    className="p-2.5 rounded-xl bg-neutral-100 hover:bg-rose-50 dark:bg-neutral-800 dark:hover:bg-rose-950/30 text-neutral-500 hover:text-rose-600 dark:text-neutral-400 dark:hover:text-rose-400 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                >
                    <LogOut size={16} />
                    <span className="hidden sm:inline">Log Out</span>
                </button>
            </motion.div>

            {/* General Preferences */}
            <div className="space-y-2">
                <p className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider px-1">
                    Preferences
                </p>

                <div className="rounded-[28px] bg-white dark:bg-[#1C1C1E] border border-neutral-200/80 dark:border-neutral-800 overflow-hidden divide-y divide-neutral-100 dark:divide-neutral-800/80 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)]">
                    {/* Privacy toggle */}
                    <div className="flex items-center justify-between px-5 py-4">
                        <div className="flex items-center gap-3.5">
                            <div className="w-9 h-9 rounded-xl bg-ios-blue/10 dark:bg-ios-blue-dark/20 text-ios-blue dark:text-ios-blue-dark flex items-center justify-center">
                                {isPrivate ? <EyeOff size={18} /> : <Eye size={18} />}
                            </div>
                            <div>
                                <p className="text-[15px] font-bold text-neutral-900 dark:text-white">
                                    Privacy Mode
                                </p>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                    Hide balances and transaction amounts
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={togglePrivacy}
                            className={`relative w-12 h-7 rounded-full transition-colors duration-300 ${isPrivate ? "bg-ios-blue dark:bg-ios-blue-dark" : "bg-neutral-200 dark:bg-neutral-700"}`}
                        >
                            <motion.div
                                className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-sm"
                                animate={{ x: isPrivate ? 22 : 2 }}
                                transition={{ type: "spring", stiffness: 700, damping: 35 }}
                            />
                        </button>
                    </div>

                    {/* Dark Mode toggle */}
                    <div className="flex items-center justify-between px-5 py-4">
                        <div className="flex items-center gap-3.5">
                            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                                {theme === "dark" ? <Moon size={18} /> : <Sun size={18} />}
                            </div>
                            <div>
                                <p className="text-[15px] font-bold text-neutral-900 dark:text-white">
                                    Dark Appearance
                                </p>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                    {theme === "dark" ? "High-contrast dark theme" : "Crisp light theme"}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                            className={`relative w-12 h-7 rounded-full transition-colors duration-300 ${theme === "dark" ? "bg-ios-blue dark:bg-ios-blue-dark" : "bg-neutral-200 dark:bg-neutral-700"}`}
                        >
                            <motion.div
                                className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-sm"
                                animate={{ x: theme === "dark" ? 22 : 2 }}
                                transition={{ type: "spring", stiffness: 700, damping: 35 }}
                            />
                        </button>
                    </div>

                    {/* Currency Selector */}
                    <div className="flex items-center justify-between px-5 py-4">
                        <div className="flex items-center gap-3.5">
                            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-sm">
                                <Globe size={18} />
                            </div>
                            <div>
                                <p className="text-[15px] font-bold text-neutral-900 dark:text-white">
                                    Primary Currency
                                </p>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                    Display symbol across dashboards
                                </p>
                            </div>
                        </div>
                        <select
                            value={currency}
                            onChange={(e) => handleCurrencyChange(e.target.value)}
                            className="bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs font-bold px-3 py-2 rounded-xl outline-none border border-transparent focus:border-ios-blue"
                        >
                            <option value="₹ INR">₹ INR</option>
                            <option value="$ USD">$ USD</option>
                            <option value="€ EUR">€ EUR</option>
                            <option value="£ GBP">£ GBP</option>
                            <option value="¥ JPY">¥ JPY</option>
                            <option value="C$ CAD">C$ CAD</option>
                            <option value="A$ AUD">A$ AUD</option>
                            <option value="AED">AED</option>
                        </select>
                    </div>

                    {/* Smart Reminders */}
                    <div className="flex items-center justify-between px-5 py-4">
                        <div className="flex items-center gap-3.5">
                            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                                <Bell size={18} />
                            </div>
                            <div>
                                <p className="text-[15px] font-bold text-neutral-900 dark:text-white">
                                    Smart Reminders
                                </p>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                    Mid-day check-in, 24h nudge &amp; budget alerts
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleTestNotification}
                                className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 transition-colors"
                                title="Send test push notification"
                            >
                                Test
                            </button>
                            <button
                                type="button"
                                onClick={toggleNotifications}
                                className={`relative w-12 h-7 rounded-full transition-colors duration-300 ${notificationsEnabled ? "bg-ios-blue dark:bg-ios-blue-dark" : "bg-neutral-200 dark:bg-neutral-700"}`}
                            >
                                <motion.div
                                    className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-sm"
                                    animate={{ x: notificationsEnabled ? 22 : 2 }}
                                    transition={{ type: "spring", stiffness: 700, damping: 35 }}
                                />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Data & Statements */}
            <div className="space-y-2">
                <p className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider px-1">
                    Statements &amp; Data
                </p>

                <div className="rounded-[28px] bg-white dark:bg-[#1C1C1E] border border-neutral-200/80 dark:border-neutral-800 overflow-hidden divide-y divide-neutral-100 dark:divide-neutral-800/80 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)]">
                    {/* Transaction Statement */}
                    <button
                        type="button"
                        onClick={() => setStatementFilterOpen(true)}
                        className="w-full flex items-center justify-between px-5 py-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors text-left group"
                    >
                        <div className="flex items-center gap-3.5">
                            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                <FileText size={18} />
                            </div>
                            <div>
                                <p className="text-[15px] font-bold text-neutral-900 dark:text-white">
                                    Transaction Statement
                                </p>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                    Export formal ledger with credits, debits &amp; balance
                                </p>
                            </div>
                        </div>
                        <ChevronRight size={18} className="text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
                    </button>

                    {/* Export JSON Data Backup */}
                    <button
                        type="button"
                        onClick={handleExportData}
                        className="w-full flex items-center justify-between px-5 py-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors text-left group"
                    >
                        <div className="flex items-center gap-3.5">
                            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                                <Download size={18} />
                            </div>
                            <div>
                                <p className="text-[15px] font-bold text-neutral-900 dark:text-white">
                                    Export Data Backup
                                </p>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                    Save an offline JSON archive of all transactions
                                </p>
                            </div>
                        </div>
                        <ChevronRight size={18} className="text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
                    </button>

                    {/* Revert Last Statement Import */}
                    <button
                        type="button"
                        onClick={() => setRollbackModalOpen(true)}
                        className="w-full flex items-center justify-between px-5 py-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors text-left group"
                    >
                        <div className="flex items-center gap-3.5">
                            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                                <Undo2 size={18} />
                            </div>
                            <div>
                                <p className="text-[15px] font-bold text-neutral-900 dark:text-white">
                                    Revert Statement Import
                                </p>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                    Undo transactions from the most recently imported statement
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {importInfoQuery.data && importInfoQuery.data.totalCount > 0 && (
                                <span className="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500">
                                    {importInfoQuery.data.totalCount} items
                                </span>
                            )}
                            <ChevronRight size={18} className="text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                    </button>

                    {/* Reset All Transactions */}
                    <button
                        type="button"
                        onClick={() => setClearModalOpen(true)}
                        className="w-full flex items-center justify-between px-5 py-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors text-left group"
                    >
                        <div className="flex items-center gap-3.5">
                            <div className="w-9 h-9 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center">
                                <Trash2 size={18} />
                            </div>
                            <div>
                                <p className="text-[15px] font-bold text-neutral-900 dark:text-white">
                                    Clear Transaction History
                                </p>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                    Permanently erase all logged expenses and incomes
                                </p>
                            </div>
                        </div>
                        <ChevronRight size={18} className="text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                </div>
            </div>

            {/* Account & Session */}
            <div className="space-y-2">
                <p className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider px-1">
                    Account & Session
                </p>

                <div className="rounded-[28px] bg-white dark:bg-[#1C1C1E] border border-neutral-200/80 dark:border-neutral-800 overflow-hidden shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)]">
                    <button
                        type="button"
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-rose-50/60 dark:hover:bg-rose-950/20 active:bg-rose-100/60 dark:active:bg-rose-950/40 transition-colors group cursor-pointer"
                    >
                        <div className="flex items-center gap-3.5">
                            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center transition-transform group-hover:scale-105">
                                <LogOut size={18} />
                            </div>
                            <div>
                                <p className="text-[15px] font-bold text-rose-600 dark:text-rose-400">
                                    Log Out
                                </p>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                    Sign out of your session on this device
                                </p>
                            </div>
                        </div>
                        <ChevronRight size={18} className="text-neutral-400 group-hover:text-rose-500 transition-colors" />
                    </button>
                </div>
            </div>

            {/* About & Version */}
            <div className="space-y-2">
                <p className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider px-1">
                    About
                </p>

                <div className="rounded-[28px] bg-white dark:bg-[#1C1C1E] border border-neutral-200/80 dark:border-neutral-800 p-6 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)] text-center space-y-3">
                    <div className="flex justify-center">
                        <Image
                            src="/logo.png?v=3"
                            alt="Floww Logo"
                            width={72}
                            height={72}
                            className="rounded-2xl shadow-sm"
                            unoptimized
                        />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight">
                            Floww
                        </h3>
                    </div>
                    <p className="text-[13px] text-neutral-600 dark:text-neutral-300 leading-relaxed max-w-md mx-auto">
                        Enterprise-grade personal financial analytics and expense intelligence platform. Engineered for automated document parsing, proactive cash-flow optimization, and cross-platform fidelity.
                    </p>

                    <div className="pt-2 flex justify-center gap-4 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                        <Link href="/privacy" className="hover:text-ios-blue transition-colors">Privacy Policy</Link>
                        <span>•</span>
                        <Link href="/terms" className="hover:text-ios-blue transition-colors">Terms of Service</Link>
                    </div>
                </div>
            </div>

            {/* In-App Industry-Standard Transaction Statement Modal */}
            <TransactionStatementModal
                open={statementFilterOpen}
                onOpenChange={setStatementFilterOpen}
                expenses={allExpenses || []}
                incomes={allIncomes || []}
                userName={session?.user?.name || "Account Holder"}
            />

            {/* Rollback Statement (Redo Upload) Modal */}
            <AnimatePresence>
                {rollbackModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => !rollbackMutation.isPending && setRollbackModalOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.94, y: 16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.94, y: 16 }}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            className="relative w-full max-w-md rounded-[28px] bg-white dark:bg-[#1C1C1E] border border-neutral-200 dark:border-neutral-800 p-6 shadow-2xl z-10 space-y-5"
                        >
                            <div className="flex items-center gap-3.5">
                                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
                                    <Undo2 size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                                        Rollback Statement
                                    </h3>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                        Redo accidental or wrong PDF upload
                                    </p>
                                </div>
                            </div>

                            {importInfoQuery.isLoading ? (
                                <div className="py-6 flex flex-col items-center justify-center gap-2 text-neutral-400">
                                    <Loader2 className="animate-spin" size={24} />
                                    <span className="text-xs">Analyzing statement history...</span>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/70 dark:border-neutral-700/60 space-y-2">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-neutral-500 dark:text-neutral-400 font-medium">Transactions to remove:</span>
                                            <span className="font-bold text-neutral-900 dark:text-white">
                                                {importInfoQuery.data?.totalCount ?? 0} records
                                            </span>
                                        </div>
                                        {importInfoQuery.data && importInfoQuery.data.totalCount > 0 && (
                                            <div className="flex items-center justify-between text-xs pt-1 border-t border-neutral-200/50 dark:border-neutral-700/50 text-neutral-500 dark:text-neutral-400">
                                                <span>Expenses: {importInfoQuery.data.expenseCount}</span>
                                                <span>Incomes: {importInfoQuery.data.incomeCount}</span>
                                            </div>
                                        )}
                                    </div>

                                    <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                                        This will cleanly remove transactions from the statement without touching your custom categories, budgets, or manual records.
                                    </p>
                                </div>
                            )}

                            <div className="space-y-2 pt-1">
                                {(importInfoQuery.data?.totalCount ?? 0) > 0 ? (
                                    <>
                                        <button
                                            type="button"
                                            disabled={rollbackMutation.isPending}
                                            onClick={async () => {
                                                await handleRollback();
                                                triggerReUpload();
                                            }}
                                            className="w-full h-12 rounded-2xl bg-ios-blue text-white font-bold text-sm shadow-md shadow-ios-blue/20 hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            {rollbackMutation.isPending ? (
                                                <Loader2 className="animate-spin" size={18} />
                                            ) : (
                                                <RefreshCw size={16} />
                                            )}
                                            Rollback &amp; Upload New PDF
                                        </button>
                                        <button
                                            type="button"
                                            disabled={rollbackMutation.isPending}
                                            onClick={handleRollback}
                                            className="w-full h-11 rounded-2xl bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold text-sm hover:bg-amber-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            {rollbackMutation.isPending ? (
                                                <Loader2 className="animate-spin" size={18} />
                                            ) : (
                                                <Undo2 size={16} />
                                            )}
                                            Rollback Transactions Only
                                        </button>
                                    </>
                                ) : (
                                    <div className="text-center py-2 text-xs text-neutral-400 font-medium">
                                        No uploaded statement transactions found to roll back.
                                    </div>
                                )}
                                <button
                                    type="button"
                                    disabled={rollbackMutation.isPending}
                                    onClick={() => setRollbackModalOpen(false)}
                                    className="w-full h-11 rounded-2xl text-neutral-600 dark:text-neutral-400 font-semibold text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Clear All Transactions Modal */}
            <AnimatePresence>
                {clearModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => !clearAllMutation.isPending && setClearModalOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.94, y: 16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.94, y: 16 }}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            className="relative w-full max-w-md rounded-[28px] bg-white dark:bg-[#1C1C1E] border border-neutral-200 dark:border-neutral-800 p-6 shadow-2xl z-10 space-y-5"
                        >
                            <div className="flex items-center gap-3.5">
                                <div className="w-12 h-12 rounded-2xl bg-red-500/15 text-red-600 dark:text-red-400 flex items-center justify-center flex-shrink-0">
                                    <Trash2 size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                                        Reset All Transactions
                                    </h3>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                        Wipe history &amp; start completely fresh
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 space-y-1">
                                    <div className="flex items-center gap-2 text-xs font-bold text-red-600 dark:text-red-400">
                                        <AlertTriangle size={15} />
                                        <span>Irreversible Action</span>
                                    </div>
                                    <p className="text-xs text-neutral-600 dark:text-neutral-300">
                                        This will permanently wipe all {((allExpenses?.length ?? 0) + (allIncomes?.length ?? 0))} transactions in your ledger. Categories, budgets, and settings will remain safe.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2 pt-1">
                                <button
                                    type="button"
                                    disabled={clearAllMutation.isPending}
                                    onClick={handleClearAll}
                                    className="w-full h-12 rounded-2xl bg-red-600 text-white font-bold text-sm shadow-md shadow-red-600/20 hover:bg-red-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {clearAllMutation.isPending ? (
                                        <Loader2 className="animate-spin" size={18} />
                                    ) : (
                                        <Trash2 size={16} />
                                    )}
                                    Wipe All &amp; Start Fresh
                                </button>
                                <button
                                    type="button"
                                    disabled={clearAllMutation.isPending}
                                    onClick={() => setClearModalOpen(false)}
                                    className="w-full h-11 rounded-2xl text-neutral-600 dark:text-neutral-400 font-semibold text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
