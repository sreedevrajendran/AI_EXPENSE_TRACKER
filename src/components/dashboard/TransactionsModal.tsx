import { useState } from "react";
import { motion } from "framer-motion";
import { Drawer } from "vaul";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { PrivacyWrapper } from "@/components/ui/PrivacyWrapper";
import { Paperclip, TrendingDown } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { AddExpenseSheet } from "@/components/expenses/AddExpenseSheet";
import { AddIncomeSheet } from "@/components/income/AddIncomeSheet";

function getIcon(name: string) {
    const key = name.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("");
    return (LucideIcons as unknown as Record<string, React.ElementType>)[key] ?? LucideIcons.Circle;
}

export type ModalTransaction = {
    id: string;
    type: "expense" | "income";
    amount: number;
    title: string;
    date: Date;
    receiptUrl?: string | null;
    category?: {
        id?: string;
        name: string;
        icon: string;
        color: string;
    } | null;
};

interface TransactionsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    transactions: ModalTransaction[];
}

export function TransactionsModal({ open, onOpenChange, title, transactions }: TransactionsModalProps) {
    const [selectedTx, setSelectedTx] = useState<ModalTransaction | null>(null);
    const [editExpenseOpen, setEditExpenseOpen] = useState(false);
    const [editIncomeOpen, setEditIncomeOpen] = useState(false);

    return (
        <Drawer.Root open={open} onOpenChange={onOpenChange}>
            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" />
                <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 max-h-[85dvh] outline-none">
                    <Drawer.Title className="sr-only">{title}</Drawer.Title>
                    <div className="bg-white dark:bg-[#1C1C1E] rounded-t-[28px] flex flex-col h-full overflow-hidden">
                        {/* Handle */}
                        <div className="flex justify-center pt-3 pb-0">
                            <div className="w-10 h-1 rounded-full bg-[#E5E5EA] dark:bg-[#3A3A3C]" />
                        </div>

                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E5EA] dark:border-[#3A3A3C]">
                            <h2 className="text-[17px] font-semibold ios-text-primary">{title}</h2>
                            <button
                                type="button"
                                onClick={() => onOpenChange(false)}
                                className="ios-text-secondary text-[15px] font-medium bg-[#F2F2F7] dark:bg-[#2C2C2E] px-3 py-1 rounded-full"
                            >
                                Done
                            </button>
                        </div>

                        {/* Content */}
                        <div className="overflow-y-auto flex-1 p-4 pb-[env(safe-area-inset-bottom,20px)]">
                            {transactions.length === 0 ? (
                                <div className="py-12 text-center">
                                    <TrendingDown size={32} className="mx-auto mb-3 ios-text-secondary opacity-50" />
                                    <p className="ios-text-secondary text-sm">No transactions found.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {transactions.map((t, i) => {
                                        const isIncome = t.type === 'income';
                                        const Icon = getIcon(t.category?.icon ?? "circle");
                                        const color = isIncome ? "#34C759" : (t.category?.color ?? "#007AFF");

                                        return (
                                            <motion.button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedTx(t);
                                                    if (isIncome) {
                                                        setEditIncomeOpen(true);
                                                    } else {
                                                        setEditExpenseOpen(true);
                                                    }
                                                }}
                                                key={`${t.type}-${t.id}`}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: Math.min(i * 0.05, 0.5) }}
                                                className="w-full text-left ios-card flex items-center justify-between p-3.5 focus:outline-none active:bg-[#F2F2F7] dark:active:bg-[#2C2C2E] transition-colors"
                                            >
                                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                                    <div
                                                        className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
                                                        style={{ backgroundColor: `${color}20` }}
                                                    >
                                                        <Icon size={18} style={{ color }} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-[15px] font-medium ios-text-primary truncate">{t.title}</p>
                                                            {t.receiptUrl && (
                                                                <div className="text-ios-blue flex-shrink-0" title="Has Attachment">
                                                                    <Paperclip size={14} />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <p className="text-xs ios-text-secondary">
                                                            {isIncome ? "Income" : (t.category?.name ?? "Uncategorized")} · {formatDate(t.date)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <PrivacyWrapper>
                                                    <p className={cn(
                                                        "text-[15px] font-semibold whitespace-nowrap",
                                                        isIncome ? "text-[#34C759] dark:text-[#32D74B]" : "ios-text-primary"
                                                    )}>
                                                        {isIncome ? "+" : "-"}{formatCurrency(t.amount)}
                                                    </p>
                                                </PrivacyWrapper>
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </Drawer.Content>

                <AddExpenseSheet
                    open={editExpenseOpen}
                    onOpenChange={setEditExpenseOpen}
                    editData={selectedTx?.type === "expense" ? {
                        id: selectedTx.id,
                        amount: selectedTx.amount,
                        merchant: selectedTx.title,
                        categoryId: selectedTx.category?.id,
                        paymentMethod: "UPI", // Defaults to UPI for now if not supplied by modal data
                        date: selectedTx.date,
                        receiptUrl: selectedTx.receiptUrl
                    } as any : undefined} // Suppress exact match since modal doesn't carry all props perfectly
                />

                <AddIncomeSheet
                    open={editIncomeOpen}
                    onOpenChange={setEditIncomeOpen}
                    editData={selectedTx?.type === "income" ? {
                        id: selectedTx.id,
                        amount: selectedTx.amount,
                        source: selectedTx.title,
                        receiptUrl: selectedTx.receiptUrl
                    } : undefined}
                />
            </Drawer.Portal>
        </Drawer.Root>
    );
}
