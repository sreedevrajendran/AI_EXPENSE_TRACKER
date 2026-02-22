"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ArrowUpRight, TrendingDown, Paperclip, Mail } from "lucide-react";
import Link from "next/link";
import { trpc } from "@/trpc/client";
import { formatCurrency, formatDate, getBudgetColor, getBudgetStatus, cn } from "@/lib/utils";
import { PrivacyWrapper } from "@/components/ui/PrivacyWrapper";
import { AddExpenseSheet } from "@/components/expenses/AddExpenseSheet";
import { ExpenseChart } from "@/components/expenses/ExpenseChart";
import { CategoryChart } from "@/components/expenses/CategoryChart";
import { IncomeExpenseChart } from "@/components/dashboard/IncomeExpenseChart";
import { AddIncomeSheet } from "@/components/income/AddIncomeSheet";
import toast from "react-hot-toast";
import { TransactionsModal, ModalTransaction } from "@/components/dashboard/TransactionsModal";
import { PullToRefresh } from "@/components/ui/PullToRefresh";
import * as LucideIcons from "lucide-react";
import { useSession } from "next-auth/react";

function getIcon(name: string) {
    const key = name.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("");
    return (LucideIcons as unknown as Record<string, React.ElementType>)[key] ?? LucideIcons.Circle;
}

export default function HomePage() {
    const { data: session } = useSession();
    const userName = session?.user?.name?.split(' ')[0] || "there";

    const [addExpenseOpen, setAddExpenseOpen] = useState(false);
    const [addIncomeOpen, setAddIncomeOpen] = useState(false);
    const [actionMenuOpen, setActionMenuOpen] = useState(false);

    // Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState("");
    const [modalTransactions, setModalTransactions] = useState<ModalTransaction[]>([]);

    const utils = trpc.useUtils();
    const [isSyncing, setIsSyncing] = useState(false);
    const syncMail = trpc.gmail.syncCurrentMonth.useMutation();

    const handleMailSync = async () => {
        setIsSyncing(true);
        const toastId = toast.loading("Syncing AI receipts...");
        try {
            const res = await syncMail.mutateAsync();
            toast.success(res.message, { id: toastId });
            // Invalidate everything to refresh dashboard
            utils.expense.getRecentExpenses.invalidate();
            utils.income.getRecentIncomes.invalidate();
            utils.expense.getMonthTotal.invalidate();
            utils.income.getMonthTotal.invalidate();
            utils.budget.list.invalidate();
        } catch (error: any) {
            if (error.message.includes("Gmail not connected")) {
                toast.error(
                    <span>
                        Gmail not connected. <a href="/settings" className="underline font-bold">Configure in Settings</a>
                    </span>,
                    { id: toastId, duration: 5000 }
                );
            } else {
                toast.error(error.message, { id: toastId });
            }
        } finally {
            setIsSyncing(false);
        }
    };

    const { data: monthTotal } = trpc.expense.getMonthTotal.useQuery();
    const { data: monthIncomeTotal } = trpc.income.getMonthTotal.useQuery();
    const { data: recentExpenses } = trpc.expense.getRecentExpenses.useQuery({ limit: 50 }); // Fetch more for modal
    const { data: recentIncomes } = trpc.income.getRecentIncomes.useQuery({ limit: 50 }); // Fetch more for modal
    const { data: budgets } = trpc.budget.list.useQuery();

    const allTransactions: ModalTransaction[] = [...(recentExpenses ?? []), ...(recentIncomes ?? [])]
        .map(t => ({
            id: t.id,
            type: 'merchant' in t ? 'expense' as const : 'income' as const,
            amount: t.amount,
            title: 'merchant' in t ? t.merchant : t.source,
            date: t.date,
            receiptUrl: t.receiptUrl,
            category: t.category,
            icon: (t as any).icon,
        }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const recentTransactions = allTransactions.slice(0, 5);

    const handleRefresh = async () => {
        await Promise.all([
            utils.expense.getMonthTotal.invalidate(),
            utils.income.getMonthTotal.invalidate(),
            utils.expense.getRecentExpenses.invalidate(),
            utils.income.getRecentIncomes.invalidate(),
            utils.budget.list.invalidate(),
            utils.ai.getInsights.invalidate()
        ]);
    };

    const totalBudget = budgets?.reduce((s, b) => s + b.amount, 0) ?? 0;
    const budgetStatus = getBudgetStatus(monthTotal ?? 0, totalBudget);
    const budgetColor = getBudgetColor(budgetStatus);

    return (
        <>
            <PullToRefresh onRefresh={handleRefresh}>
                <div className="px-4 pt-3 pb-6 space-y-4 md:px-8 md:pt-6">
                    {/* Greeting */}
                    <div className="mb-2">
                        <h1 className="text-2xl font-bold ios-text-primary">Hi, {userName} 👋</h1>
                    </div>

                    <div className="md:grid md:grid-cols-12 md:gap-6 md:space-y-0 space-y-4">
                        {/* Left Column (Stats & Chart) */}
                        <div className="md:col-span-7 space-y-4">
                            {/* Summary Card */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="rounded-[28px] overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
                                style={{ background: "linear-gradient(135deg, #007AFF 0%, #5856D6 100%)" }}
                                onClick={() => {
                                    setModalTitle("All Transactions");
                                    setModalTransactions(allTransactions);
                                    setModalOpen(true);
                                }}
                            >
                                <div className="p-6 text-white space-y-4">
                                    <div>
                                        <p className="text-sm text-white/70 font-medium">Balance This Month</p>
                                        <PrivacyWrapper>
                                            <p className="text-5xl font-bold mt-1 tracking-tight">
                                                {formatCurrency((monthIncomeTotal ?? 0) - (monthTotal ?? 0))}
                                            </p>
                                        </PrivacyWrapper>
                                    </div>
                                    {/* Budget progress bar removed per user request */}
                                </div>
                            </motion.div>

                            {/* Quick Stats: Income / Expense */}
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <button
                                    className="ios-card p-4 text-left cursor-pointer active:scale-[0.98] transition-transform"
                                    onClick={() => {
                                        setModalTitle("Total Income");
                                        setModalTransactions(allTransactions.filter(t => t.type === 'income'));
                                        setModalOpen(true);
                                    }}
                                >
                                    <p className="text-xs ios-text-secondary mb-1">Total Income</p>
                                    <PrivacyWrapper>
                                        <p className="text-xl font-bold text-[#34C759] dark:text-[#32D74B]">
                                            +{formatCurrency(monthIncomeTotal ?? 0)}
                                        </p>
                                    </PrivacyWrapper>
                                </button>
                                <button
                                    className="ios-card p-4 text-left cursor-pointer active:scale-[0.98] transition-transform"
                                    onClick={() => {
                                        setModalTitle("Total Spent");
                                        setModalTransactions(allTransactions.filter(t => t.type === 'expense'));
                                        setModalOpen(true);
                                    }}
                                >
                                    <p className="text-xs ios-text-secondary mb-1">Total Spent</p>
                                    <PrivacyWrapper>
                                        <p className="text-xl font-bold text-[#FF3B30] dark:text-[#FF453A]">
                                            -{formatCurrency(monthTotal ?? 0)}
                                        </p>
                                    </PrivacyWrapper>
                                </button>
                            </div>

                            {/* Quick Stats: Budget */}
                            {budgets && budgets.length > 0 && (
                                <div className="space-y-3 mb-4">
                                    {budgets.map((budget) => {
                                        const isOverall = !budget.category;
                                        const title = isOverall ? "Overall Budget" : `${budget.category?.name ?? "Category"} Budget`;
                                        const spent = (budget as any).spent ?? 0;
                                        const remaining = Math.max(budget.amount - spent, 0);
                                        const percent = budget.amount > 0 ? Math.min((spent / budget.amount) * 100, 100) : 0;
                                        const color = getBudgetColor(getBudgetStatus(spent, budget.amount));

                                        return (
                                            <button
                                                key={budget.id}
                                                className="w-full block ios-card p-4 active:scale-[0.98] transition-transform text-left"
                                                onClick={() => {
                                                    setModalTitle(title);
                                                    // Filter transactions by expense and the correct category id 
                                                    const filtered = allTransactions.filter(t =>
                                                        t.type === 'expense' &&
                                                        (isOverall ? true : t.category?.id === budget.categoryId)
                                                    );
                                                    setModalTransactions(filtered);
                                                    setModalOpen(true);
                                                }}
                                            >
                                                <div className="flex justify-between items-center mb-2">
                                                    <p className="text-[15px] font-semibold ios-text-primary">{title}</p>
                                                    <PrivacyWrapper>
                                                        <p className="text-[15px] font-bold" style={{ color }}>
                                                            {formatCurrency(remaining)} left
                                                        </p>
                                                    </PrivacyWrapper>
                                                </div>
                                                <div className="h-2 rounded-full bg-black/5 dark:bg-white/5 overflow-hidden">
                                                    <motion.div
                                                        className="h-full rounded-full"
                                                        style={{ backgroundColor: color }}
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${percent}%` }}
                                                        transition={{ duration: 0.8, ease: "easeOut" }}
                                                    />
                                                </div>
                                                <div className="flex justify-between items-center mt-2.5">
                                                    <p className="text-xs ios-text-secondary font-medium">Used: {percent.toFixed(0)}%</p>
                                                    <PrivacyWrapper>
                                                        <p className="text-xs ios-text-secondary font-medium">{formatCurrency(spent)} of {formatCurrency(budget.amount)}</p>
                                                    </PrivacyWrapper>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                            <IncomeExpenseChart />
                            <CategoryChart />
                        </div> {/* End Left Column */}

                        {/* Right Column (Transactions) */}
                        <div className="md:col-span-5">

                            {/* Recent Transactions */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h2 className="text-[20px] font-bold ios-text-primary">Recent</h2>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={handleMailSync}
                                            disabled={isSyncing}
                                            className="text-ios-blue dark:text-ios-blue-dark text-sm font-medium flex items-center gap-1 bg-ios-blue/10 dark:bg-ios-blue-dark/10 px-2.5 py-1 rounded-md active:scale-95 transition-transform disabled:opacity-50"
                                        >
                                            {isSyncing ? "Syncing..." : <><Mail size={14} /> AI Sync</>}
                                        </button>
                                        <a href="/expenses" className="text-ios-blue dark:text-ios-blue-dark text-sm font-medium flex items-center gap-1">
                                            See all <ArrowUpRight size={14} />
                                        </a>
                                    </div>
                                </div>

                                {recentTransactions.length === 0 ? (
                                    <div className="ios-card p-8 text-center">
                                        <TrendingDown size={32} className="mx-auto mb-3 ios-text-secondary opacity-50" />
                                        <p className="ios-text-secondary text-sm">No recent transactions.</p>
                                        <p className="text-xs ios-text-secondary mt-1 opacity-60">Tap + to add your first one!</p>
                                    </div>
                                ) : (
                                    <div className="ios-card overflow-hidden divide-y ios-separator">
                                        {recentTransactions.map((t, i) => {
                                            const isIncome = t.type === 'income';
                                            const title = isIncome ? (t as any).source : (t as any).merchant;
                                            const Icon = getIcon(t.category?.icon ?? t.icon ?? "circle");
                                            const color = isIncome ? "#34C759" : (t.category?.color ?? "#007AFF");

                                            return (
                                                <motion.div
                                                    key={`${t.type}-${t.id}`}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: i * 0.05 }}
                                                    className="flex items-center gap-3 px-4 py-3.5 flex-shrink-0"
                                                >
                                                    <div
                                                        className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
                                                        style={{ backgroundColor: `${color}20` }}
                                                    >
                                                        <Icon size={18} style={{ color }} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-[15px] font-medium ios-text-primary truncate">{title}</p>
                                                            {t.receiptUrl && (
                                                                <a href={t.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-ios-blue hover:opacity-80 transition-opacity flex-shrink-0" onClick={(e) => e.stopPropagation()} title="View Attachment">
                                                                    <Paperclip size={14} />
                                                                </a>
                                                            )}
                                                        </div>
                                                        <p className="text-xs ios-text-secondary">
                                                            {isIncome ? "Income" : (t.category?.name ?? "Uncategorized")} · {formatDate(t.date)}
                                                        </p>
                                                    </div>
                                                    <PrivacyWrapper>
                                                        <p className={cn(
                                                            "text-[15px] font-semibold whitespace-nowrap",
                                                            isIncome ? "text-[#34C759] dark:text-[#32D74B]" : "ios-text-primary"
                                                        )}>
                                                            {isIncome ? "+" : "-"}{formatCurrency(t.amount)}
                                                        </p>
                                                    </PrivacyWrapper>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div> {/* End Right Column */}
                    </div> {/* End Grid */}
                </div> {/* End Main Content Area */}
            </PullToRefresh>

            {/* Desktop Action Buttons (Hidden on mobile) */}
            <div className="hidden md:flex fixed bottom-8 right-8 gap-4 z-40">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setAddIncomeOpen(true)}
                    className="px-6 py-3 rounded-full font-semibold shadow-ios-lg bg-white dark:bg-[#1C1C1E] text-[#FF9500] border border-[#FF9500]/20 flex items-center gap-2"
                >
                    <Plus size={20} /> Add Income
                </motion.button>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setAddExpenseOpen(true)}
                    className="px-6 py-3 rounded-full text-white font-semibold shadow-ios-lg flex items-center gap-2"
                    style={{ background: "linear-gradient(135deg, #FF2D55, #FF375F)" }}
                >
                    <Plus size={20} /> Add Expense
                </motion.button>
            </div>

            {/* Mobile FAB with Expandable Menu */}
            <div className="fixed bottom-[calc(83px+env(safe-area-inset-bottom,0px)+16px)] right-5 z-40 md:hidden flex flex-col items-end">
                <AnimatePresence>
                    {actionMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8, y: 20 }}
                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                            className="flex flex-col gap-3 mb-4 items-end"
                        >
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => {
                                    setAddIncomeOpen(true);
                                    setActionMenuOpen(false);
                                }}
                                className="flex items-center gap-3 bg-white dark:bg-[#2C2C2E] px-4 py-2.5 rounded-full shadow-lg border border-[#E5E5EA] dark:border-[#3A3A3C]"
                            >
                                <span className="text-[15px] font-semibold text-[#FF9500]">Income</span>
                                <div className="w-8 h-8 rounded-full bg-[#FF9500]/10 flex items-center justify-center">
                                    <ArrowUpRight size={18} className="text-[#FF9500]" />
                                </div>
                            </motion.button>

                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => {
                                    setAddExpenseOpen(true);
                                    setActionMenuOpen(false);
                                }}
                                className="flex items-center gap-3 bg-white dark:bg-[#2C2C2E] px-4 py-2.5 rounded-full shadow-lg border border-[#E5E5EA] dark:border-[#3A3A3C]"
                            >
                                <span className="text-[15px] font-semibold text-[#FF2D55]">Expense</span>
                                <div className="w-8 h-8 rounded-full bg-[#FF2D55]/10 flex items-center justify-center">
                                    <TrendingDown size={18} className="text-[#FF2D55]" />
                                </div>
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>

                <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={() => setActionMenuOpen(!actionMenuOpen)}
                    animate={{ rotate: actionMenuOpen ? 45 : 0 }}
                    className="w-14 h-14 rounded-full shadow-ios-lg flex items-center justify-center relative bg-ios-blue dark:bg-ios-blue-dark"
                >
                    <Plus size={28} className="text-white relative z-10" strokeWidth={2.5} />
                </motion.button>
            </div>

            {/* Backdrop for mobile FAB menu */}
            <AnimatePresence>
                {actionMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setActionMenuOpen(false)}
                        className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm md:hidden"
                    />
                )}
            </AnimatePresence>

            <AddExpenseSheet open={addExpenseOpen} onOpenChange={setAddExpenseOpen} />
            <AddIncomeSheet open={addIncomeOpen} onOpenChange={setAddIncomeOpen} />

            {/* Detailed Transaction Modals */}
            <TransactionsModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                title={modalTitle}
                transactions={modalTransactions}
            />
        </>
    );
}
