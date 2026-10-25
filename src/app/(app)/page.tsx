"use client";

import { useState, useEffect } from "react";
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
import { DailyExpenseChart } from "@/components/expenses/DailyExpenseChart";
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
    const [editExpenseId, setEditExpenseId] = useState<string | null>(null);
    const [editIncomeId, setEditIncomeId] = useState<string | null>(null);

    // Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState("");
    const [modalTransactions, setModalTransactions] = useState<ModalTransaction[]>([]);

    const utils = trpc.useUtils();


    const [periodView, setPeriodView] = useState<"all" | "active">("all");
    const { data: monthTotal } = trpc.expense.getMonthTotal.useQuery(periodView === "all" ? { allTime: true } : undefined);
    const { data: monthIncomeTotal } = trpc.income.getMonthTotal.useQuery(periodView === "all" ? { allTime: true } : undefined);
    const { data: activePeriod } = trpc.expense.getActivePeriod.useQuery();
    const { data: recentExpenses } = trpc.expense.getRecentExpenses.useQuery({ limit: 100 }); // Fetch more for modal
    const { data: recentIncomes } = trpc.income.getRecentIncomes.useQuery({ limit: 100 }); // Fetch more for modal
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

    useEffect(() => {
        const handleUpdate = () => {
            utils.invalidate();
        };
        window.addEventListener("app:transactions-updated", handleUpdate);
        return () => window.removeEventListener("app:transactions-updated", handleUpdate);
    }, [utils]);

    const handleRefresh = async () => {
        await utils.invalidate();
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
                            {/* Combined Hero Stats Card */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="rounded-[32px] overflow-hidden mb-4 relative shadow-[0_12px_36px_-6px_rgba(10,132,255,0.3)] border border-white/20 dark:border-white/10"
                                style={{ background: "linear-gradient(135deg, #0A84FF 0%, #5E5CE6 50%, #7B61FF 100%)" }}
                            >
                                <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 rounded-full bg-white/20 blur-3xl pointer-events-none" />
                                <div className="absolute bottom-0 left-0 -ml-12 -mb-12 w-40 h-40 rounded-full bg-black/20 blur-2xl pointer-events-none" />

                                <div className="p-6 text-white space-y-5 relative z-10">
                                    <div
                                        className="cursor-pointer active:scale-[0.99] transition-transform"
                                        onClick={() => {
                                            setModalTitle("All Transactions");
                                            setModalTransactions(allTransactions);
                                            setModalOpen(true);
                                        }}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="text-[13px] text-white/80 font-bold uppercase tracking-wider">Net Balance</p>
                                            <div className="flex items-center bg-black/25 backdrop-blur-md p-0.5 rounded-full border border-white/15">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setPeriodView("all");
                                                    }}
                                                    className={cn(
                                                        "text-[10px] font-bold px-2.5 py-0.5 rounded-full transition-all",
                                                        periodView === "all" ? "bg-white text-blue-600 shadow-xs" : "text-white/80 hover:text-white"
                                                    )}
                                                >
                                                    All Time
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setPeriodView("active");
                                                    }}
                                                    className={cn(
                                                        "text-[10px] font-bold px-2.5 py-0.5 rounded-full transition-all",
                                                        periodView === "active" ? "bg-white text-blue-600 shadow-xs" : "text-white/80 hover:text-white"
                                                    )}
                                                >
                                                    {activePeriod?.label ?? "Active Month"}
                                                </button>
                                            </div>
                                        </div>
                                        <PrivacyWrapper>
                                            <p className="text-4xl md:text-5xl font-black tracking-tight drop-shadow-xs">
                                                {formatCurrency((monthIncomeTotal ?? 0) - (monthTotal ?? 0))}
                                            </p>
                                        </PrivacyWrapper>
                                    </div>

                                    <div className="h-[1px] w-full bg-white/20 rounded-full" />

                                    <div className="grid grid-cols-2 gap-4">
                                        <div
                                            className="cursor-pointer active:scale-[0.98] transition-transform bg-white/10 hover:bg-white/15 p-3 rounded-2xl backdrop-blur-md transition-colors"
                                            onClick={() => {
                                                setModalTitle("Total Income");
                                                setModalTransactions(allTransactions.filter(t => t.type === 'income'));
                                                setModalOpen(true);
                                            }}
                                        >
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <div className="w-5 h-5 rounded-full bg-emerald-400/30 flex items-center justify-center">
                                                    <ArrowUpRight size={12} className="text-emerald-300" />
                                                </div>
                                                <span className="text-[11px] text-white/80 font-bold uppercase tracking-wider">Income</span>
                                            </div>
                                            <PrivacyWrapper>
                                                <p className="text-lg md:text-xl font-bold tracking-tight text-white">
                                                    +{formatCurrency(monthIncomeTotal ?? 0)}
                                                </p>
                                            </PrivacyWrapper>
                                        </div>

                                        <div
                                            className="cursor-pointer active:scale-[0.98] transition-transform bg-white/10 hover:bg-white/15 p-3 rounded-2xl backdrop-blur-md transition-colors"
                                            onClick={() => {
                                                setModalTitle("Total Spent");
                                                setModalTransactions(allTransactions.filter(t => t.type === 'expense'));
                                                setModalOpen(true);
                                            }}
                                        >
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <div className="w-5 h-5 rounded-full bg-rose-400/30 flex items-center justify-center">
                                                    <TrendingDown size={12} className="text-rose-300" />
                                                </div>
                                                <span className="text-[11px] text-white/80 font-bold uppercase tracking-wider">Spent</span>
                                            </div>
                                            <PrivacyWrapper>
                                                <p className="text-lg md:text-xl font-bold tracking-tight text-white">
                                                    -{formatCurrency(monthTotal ?? 0)}
                                                </p>
                                            </PrivacyWrapper>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

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
                                                className="w-full block bg-white/60 dark:bg-[#1C1C1E]/60 backdrop-blur-2xl border border-white/50 dark:border-white/5 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.05)] rounded-[24px] p-5 active:scale-[0.98] transition-all text-left"
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
                            <DailyExpenseChart />
                            <CategoryChart />
                        </div> {/* End Left Column */}

                        {/* Right Column (Transactions) */}
                        <div className="md:col-span-5">

                            {/* Recent Transactions */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h2 className="text-[20px] font-bold ios-text-primary">Recent</h2>
                                    <div className="flex items-center gap-3">
                                        <a href="/expenses" className="text-ios-blue dark:text-ios-blue-dark text-sm font-medium flex items-center gap-1">
                                            See all <ArrowUpRight size={14} />
                                        </a>
                                    </div>
                                </div>

                                {recentTransactions.length === 0 ? (
                                    <div className="bg-white/60 dark:bg-[#1C1C1E]/60 backdrop-blur-2xl border border-white/50 dark:border-white/5 shadow-sm rounded-[24px] p-8 text-center">
                                        <TrendingDown size={32} className="mx-auto mb-3 ios-text-secondary opacity-50" />
                                        <p className="ios-text-secondary text-sm">No recent transactions.</p>
                                        <p className="text-xs ios-text-secondary mt-1 opacity-60">Tap + to add your first one!</p>
                                    </div>
                                ) : (
                                    <div className="bg-white/60 dark:bg-[#1C1C1E]/60 backdrop-blur-2xl border border-white/50 dark:border-white/5 shadow-sm rounded-[24px] overflow-hidden divide-y divide-[#E5E5EA] dark:divide-[#3A3A3C]">
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
                                                    onClick={() => {
                                                        if (isIncome) {
                                                            setEditIncomeId(t.id);
                                                            setAddIncomeOpen(true);
                                                        } else {
                                                            setEditExpenseId(t.id);
                                                            setAddExpenseOpen(true);
                                                        }
                                                    }}
                                                    className="flex items-center gap-3 px-4 py-3.5 flex-shrink-0 cursor-pointer active:bg-black/5 dark:active:bg-white/5 transition-colors"
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

            <AddExpenseSheet open={addExpenseOpen} onOpenChange={(open) => { setAddExpenseOpen(open); if (!open) setTimeout(() => setEditExpenseId(null), 300); }} editId={editExpenseId} />
            <AddIncomeSheet open={addIncomeOpen} onOpenChange={(open) => { setAddIncomeOpen(open); if (!open) setTimeout(() => setEditIncomeId(null), 300); }} editId={editIncomeId} />

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
