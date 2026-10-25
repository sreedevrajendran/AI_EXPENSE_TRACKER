"use client";

import { useState, useRef, useEffect } from "react";
import { Drawer } from "vaul";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, Sparkles, User, Bot, Check, TrendingDown, ArrowUpRight, CheckCircle2, Receipt, ChevronDown, ChevronUp } from "lucide-react";
import { trpc } from "@/trpc/client";
import { cn, formatCurrency } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import toast from "react-hot-toast";
import { showMatchingAlert } from "@/components/ui/AlertCard";
import { useCurrency } from "@/context/CurrencyContext";

interface AgentFlowwChatSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

interface ActionData {
    type: "expense" | "income";
    amount: number;
    merchant: string;
    category?: string;
    paymentMethod?: "CASH" | "CARD" | "UPI" | "BANK_TRANSFER" | "OTHER";
    date?: string;
}

export interface RAGCitationData {
    id: string;
    title: string;
    amount: number;
    date: string;
    category?: string;
    type: "expense" | "income";
    paymentMethod?: string;
}

type Message = {
    id: string;
    role: "user" | "assistant";
    content: string;
    action?: ActionData;
    citations?: RAGCitationData[];
    added?: boolean;
    dismissedAction?: boolean;
};

export function AgentFlowwChatSheet({ open, onOpenChange }: AgentFlowwChatSheetProps) {
    const { currencySymbol, currencyCode, formatCurrency: contextFormatCurrency } = useCurrency();
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "initial",
            role: "assistant",
            content: "Hello! I am Agent Floww, your financial intelligence assistant. You can ask me about your spending trends, cash flow, specific merchants, or log transactions in natural language (e.g., **\"Spent $45 on lunch\"** or **\"Received $3,000 salary deposit\"**)."
        }
    ]);
    const [input, setInput] = useState("");
    const [addingActionId, setAddingActionId] = useState<string | null>(null);
    const [expandedCitations, setExpandedCitations] = useState<Record<string, boolean>>({});

    const toggleCitations = (messageId: string) => {
        setExpandedCitations(prev => ({ ...prev, [messageId]: !prev[messageId] }));
    };

    const scrollRef = useRef<HTMLDivElement>(null);
    const chatMutation = trpc.ai.chat.useMutation();
    const createExpense = trpc.expense.create.useMutation();
    const createIncome = trpc.income.create.useMutation();
    const utils = trpc.useUtils();

    const invalidateAll = () => {
        utils.expense.invalidate();
        utils.income.invalidate();
        utils.budget.invalidate();
        utils.ai.invalidate();
    };

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, chatMutation.isPending]);

    const handleSend = async () => {
        if (!input.trim() || chatMutation.isPending) return;

        const userMessage: Message = { id: Date.now().toString(), role: "user", content: input.trim() };
        setMessages(prev => [...prev, userMessage]);
        setInput("");

        try {
            const history = [...messages, userMessage].map(m => ({ role: m.role, content: m.content }));
            const response = await chatMutation.mutateAsync({
                messages: history,
                currency: currencyCode,
            });
            const newAssistantId = (Date.now() + 1).toString();
            const citations = (response as any).citations as RAGCitationData[] | undefined;

            setMessages(prev => [...prev, {
                id: newAssistantId,
                role: "assistant",
                content: response.message,
                action: (response as any).action as ActionData | undefined,
                citations,
            }]);
        } catch (error) {
            console.error("Chat error:", error);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: "assistant",
                content: "I am currently unable to complete your request. Please check your internet connection and try again."
            }]);
        }
    };

    const handleSendPreset = async (presetText: string) => {
        if (chatMutation.isPending) return;

        const userMessage: Message = { id: Date.now().toString(), role: "user", content: presetText };
        setMessages(prev => [...prev, userMessage]);

        try {
            const history = [...messages, userMessage].map(m => ({ role: m.role, content: m.content }));
            const response = await chatMutation.mutateAsync({
                messages: history,
                currency: currencyCode,
            });
            const newAssistantId = (Date.now() + 1).toString();
            const citations = (response as any).citations as RAGCitationData[] | undefined;

            setMessages(prev => [...prev, {
                id: newAssistantId,
                role: "assistant",
                content: response.message,
                action: (response as any).action as ActionData | undefined,
                citations,
            }]);
        } catch (error) {
            console.error("Chat error:", error);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: "assistant",
                content: "I am currently unable to complete your request. Please check your internet connection and try again."
            }]);
        }
    };

    const handleConfirmAction = async (messageId: string, action: ActionData) => {
        setAddingActionId(messageId);
        try {
            if (action.type === "expense") {
                await createExpense.mutateAsync({
                    amount: action.amount,
                    merchant: action.merchant,
                    paymentMethod: action.paymentMethod === "CARD" ? "CREDIT_CARD" : ((action.paymentMethod as any) || "UPI"),
                    categoryName: action.category || "Other",
                    date: new Date(),
                });
                showMatchingAlert({
                    type: "expense",
                    status: "success",
                    title: "Expense Added from Chat",
                    message: `${action.merchant} recorded in your expenses`,
                    amount: action.amount,
                });
            } else {
                await createIncome.mutateAsync({
                    amount: action.amount,
                    source: action.merchant,
                    date: new Date(),
                });
                showMatchingAlert({
                    type: "income",
                    status: "success",
                    title: "Income Added from Chat",
                    message: `${action.merchant} recorded in your incomes`,
                    amount: action.amount,
                });
            }

            setMessages(prev => prev.map(m => m.id === messageId ? { ...m, added: true } : m));
            invalidateAll();

            // Auto-dismiss confirmed action card after 5s with iOS exit animation
            setTimeout(() => {
                setMessages(prev => prev.map(m => m.id === messageId ? { ...m, dismissedAction: true } : m));
            }, 5000);
        } catch (err) {
            console.error("Failed to add transaction from chat:", err);
            showMatchingAlert({
                type: action.type,
                status: "error",
                title: "Failed to Add Transaction",
                message: "Could not record transaction. Please try again.",
            });
        } finally {
            setAddingActionId(null);
        }
    };

    return (
        <Drawer.Root open={open} onOpenChange={onOpenChange}>
            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" />
                <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 h-[92dvh] outline-none flex flex-col">
                    <Drawer.Title className="sr-only">Chat with Agent Floww</Drawer.Title>
                    <div className="bg-[#F9F9FB] dark:bg-[#161618] rounded-t-[32px] flex flex-col flex-1 h-full overflow-hidden border-t border-black/5 dark:border-white/10 shadow-2xl">
                        {/* Drag Handle */}
                        <div className="flex justify-center pt-3 pb-0 flex-none">
                            <div className="w-12 h-1.5 rounded-full bg-[#D1D1D6] dark:bg-[#3A3A3C]" />
                        </div>

                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-3.5 border-b border-black/5 dark:border-white/5 flex-none bg-white/70 dark:bg-[#1C1C1E]/70 backdrop-blur-md">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                                    <Sparkles size={18} />
                                </div>
                                <div>
                                    <h2 className="text-[17px] font-bold text-neutral-900 dark:text-white leading-tight">Agent Floww</h2>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">Smart Financial Assistant</p>
                                    </div>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => onOpenChange(false)}
                                className="text-[13px] font-semibold text-neutral-600 dark:text-neutral-300 bg-neutral-200/60 dark:bg-neutral-800 px-3 py-1.5 rounded-full hover:bg-neutral-300/60 transition-colors"
                            >
                                Close
                            </button>
                        </div>

                        {/* Chat Messages Area */}
                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                            <AnimatePresence initial={false}>
                                {messages.map((message) => (
                                    <motion.div
                                        key={message.id}
                                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        className={cn(
                                            "flex gap-3 max-w-[88%]",
                                            message.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 shadow-sm",
                                            message.role === "user"
                                                ? "bg-ios-blue text-white"
                                                : "bg-white dark:bg-[#252529] text-purple-600 dark:text-purple-400 border border-black/5 dark:border-white/5"
                                        )}>
                                            {message.role === "user" ? <User size={16} /> : <Bot size={16} />}
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <div className={cn(
                                                "px-4 py-3 rounded-2xl text-[15px] leading-relaxed",
                                                message.role === "user"
                                                    ? "bg-ios-blue text-white rounded-tr-sm shadow-sm"
                                                    : "bg-white dark:bg-[#1F1F23] text-neutral-900 dark:text-neutral-100 rounded-tl-sm shadow-sm border border-neutral-200/80 dark:border-neutral-800"
                                            )}>
                                                {message.role === "user" ? (
                                                    <p className="whitespace-pre-wrap">{message.content}</p>
                                                ) : (
                                                    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 text-[14px]">
                                                        <ReactMarkdown>{message.content}</ReactMarkdown>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Referenced Transactions Citations */}
                                            {message.citations && message.citations.length > 0 && (
                                                <div className="flex flex-col gap-1.5 mt-0.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleCitations(message.id)}
                                                        className="self-start flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-[11px] font-semibold border border-indigo-200/60 dark:border-indigo-800/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors shadow-2xs"
                                                    >
                                                        <Receipt size={12} className="text-indigo-600 dark:text-indigo-400" />
                                                        <span>{message.citations.length} Referenced Transaction{message.citations.length > 1 ? "s" : ""}</span>
                                                        {expandedCitations[message.id] ? (
                                                            <ChevronUp size={12} className="opacity-70" />
                                                        ) : (
                                                            <ChevronDown size={12} className="opacity-70" />
                                                        )}
                                                    </button>

                                                    {expandedCitations[message.id] && (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: -4 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            className="flex flex-col gap-1.5 p-2 rounded-2xl bg-neutral-100/90 dark:bg-[#1E1E22] border border-neutral-200/80 dark:border-neutral-800 shadow-xs max-w-full"
                                                        >
                                                            <div className="flex items-center justify-between px-1.5 pb-1 border-b border-black/5 dark:border-white/5">
                                                                <span className="text-[10px] uppercase tracking-wider font-bold text-neutral-500 dark:text-neutral-400">
                                                                    Referenced Transactions
                                                                </span>
                                                                <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-medium">
                                                                    From your ledger
                                                                </span>
                                                            </div>
                                                            <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-0.5">
                                                                {message.citations.map((c) => (
                                                                    <div
                                                                        key={c.id}
                                                                        className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#252529] border border-black/5 dark:border-white/5 shadow-2xs"
                                                                    >
                                                                        <div className="flex items-center gap-2 min-w-0 pr-2">
                                                                            <div className={cn(
                                                                                "w-6 h-6 rounded-lg flex items-center justify-center text-white flex-shrink-0 text-[10px] font-bold shadow-2xs",
                                                                                c.type === "expense" ? "bg-red-500" : "bg-emerald-500"
                                                                            )}>
                                                                                {c.type === "expense" ? <TrendingDown size={12} /> : <ArrowUpRight size={12} />}
                                                                            </div>
                                                                            <div className="min-w-0 truncate">
                                                                                <p className="font-semibold text-neutral-900 dark:text-neutral-100 truncate text-[12px] leading-tight">
                                                                                    {c.title}
                                                                                </p>
                                                                                <p className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">
                                                                                    {new Date(c.date).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })} · {c.category || "General"}{c.paymentMethod ? ` · ${c.paymentMethod}` : ""}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                        <span className={cn(
                                                                            "font-bold text-[12px] flex-shrink-0 tabular-nums",
                                                                            c.type === "expense" ? "text-red-500" : "text-emerald-500"
                                                                        )}>
                                                                            {contextFormatCurrency(c.amount)}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </div>
                                            )}

                                             {/* Interactive Action Card if bot detected an add action */}
                                            <AnimatePresence>
                                                {message.action && !message.dismissedAction && (
                                                    <motion.div
                                                        key={`action-${message.id}`}
                                                        initial={{ opacity: 0, scale: 0.95 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{
                                                            opacity: 0,
                                                            y: -20,
                                                            scale: 0.92,
                                                            filter: "blur(6px)",
                                                            transition: { duration: 0.28, ease: [0.32, 0.72, 0, 1] }
                                                        }}
                                                        className="p-4 rounded-2xl bg-white dark:bg-[#1E1E22] border border-neutral-200 dark:border-neutral-700 shadow-md flex flex-col gap-3 relative overflow-hidden"
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2.5">
                                                                <div className={cn(
                                                                    "w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold",
                                                                    message.action.type === "expense"
                                                                        ? "bg-gradient-to-br from-red-500 to-rose-600 shadow-sm shadow-red-500/20"
                                                                        : "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm shadow-emerald-500/20"
                                                                )}>
                                                                    {message.action.type === "expense" ? (
                                                                        <TrendingDown size={18} />
                                                                    ) : (
                                                                        <ArrowUpRight size={18} />
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <h4 className="text-[15px] font-bold text-neutral-900 dark:text-white leading-tight">
                                                                        {message.action.merchant}
                                                                    </h4>
                                                                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 capitalize">
                                                                        {message.action.category || (message.action.type === "expense" ? "Expense" : "Income")} · {message.action.paymentMethod || "UPI"}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className={cn(
                                                                "text-[18px] font-black tracking-tight",
                                                                message.action.type === "expense" ? "text-red-500" : "text-emerald-500"
                                                            )}>
                                                                {formatCurrency(message.action.amount)}
                                                            </div>
                                                        </div>

                                                        <button
                                                            type="button"
                                                            disabled={message.added || addingActionId === message.id}
                                                            onClick={() => handleConfirmAction(message.id, message.action!)}
                                                            className={cn(
                                                                "w-full py-2.5 px-4 rounded-xl font-bold text-[14px] flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98]",
                                                                message.added
                                                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 cursor-default"
                                                                    : message.action.type === "expense"
                                                                        ? "bg-red-500 hover:bg-red-600 text-white"
                                                                        : "bg-emerald-600 hover:bg-emerald-700 text-white"
                                                            )}
                                                        >
                                                            {addingActionId === message.id ? (
                                                                <>
                                                                    <Loader2 size={16} className="animate-spin" />
                                                                    <span>Adding to {message.action.type}...</span>
                                                                </>
                                                            ) : message.added ? (
                                                                <>
                                                                    <CheckCircle2 size={16} className="text-emerald-500" />
                                                                    <span>Added to {message.action.type === "expense" ? "Expenses" : "Incomes"}</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Check size={16} />
                                                                    <span>Confirm &amp; Add to {message.action.type === "expense" ? "Expenses" : "Incomes"}</span>
                                                                </>
                                                            )}
                                                        </button>

                                                        {/* 5-second countdown timer bar upon confirmation */}
                                                        {message.added && (
                                                            <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-black/5 dark:bg-white/10 overflow-hidden">
                                                                <motion.div
                                                                    initial={{ width: "100%" }}
                                                                    animate={{ width: "0%" }}
                                                                    transition={{ duration: 5, ease: "linear" }}
                                                                    className="h-full bg-emerald-500"
                                                                />
                                                            </div>
                                                        )}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </motion.div>
                                ))}

                                {chatMutation.isPending && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex gap-3 max-w-[85%] mr-auto"
                                    >
                                        <div className="w-8 h-8 rounded-xl bg-white dark:bg-[#252529] text-purple-600 dark:text-purple-400 border border-black/5 dark:border-white/5 flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                                            <Bot size={16} />
                                        </div>
                                        <div className="px-5 py-3 rounded-2xl bg-white dark:bg-[#1F1F23] rounded-tl-sm flex items-center gap-1.5 h-[46px] border border-neutral-200/80 dark:border-neutral-800 shadow-sm">
                                            <motion.div className="w-2 h-2 bg-purple-500 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} />
                                            <motion.div className="w-2 h-2 bg-indigo-500 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} />
                                            <motion.div className="w-2 h-2 bg-blue-500 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Preset Suggestions Area */}
                        {messages.length <= 2 && !chatMutation.isPending && (
                            <div className="px-4 pb-3 overflow-x-auto flex gap-2 no-scrollbar border-t border-black/5 dark:border-white/5 pt-3 bg-white/40 dark:bg-black/20">
                                {[
                                    "Monthly spending breakdown",
                                    "Largest expenses recorded",
                                    "Cash flow and net balance",
                                    "Recent UPI payments",
                                    `Log: Spent ${currencySymbol}45 on fuel via Card`,
                                    `Log: Received ${currencySymbol}3,000 salary deposit`,
                                ].map((question, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleSendPreset(question)}
                                        className="whitespace-nowrap px-3.5 py-1.5 rounded-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#1F1F23] text-[12px] font-semibold text-neutral-700 dark:text-neutral-300 hover:border-ios-blue hover:text-ios-blue transition-colors flex-shrink-0 shadow-2xs"
                                    >
                                        {question}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Input Area */}
                        <div className="p-4 bg-white dark:bg-[#1C1C1E] border-t border-black/5 dark:border-white/5 pb-[env(safe-area-inset-bottom,16px)]">
                            <div className="relative flex items-center">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSend();
                                        }
                                    }}
                                    placeholder="Type to ask or 'Spent $40 on fuel'..."
                                    className="w-full pl-5 pr-14 py-3.5 bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-full outline-none ios-text-primary placeholder-[#8E8E93] dark:placeholder-[#636366] text-[15px] border border-transparent focus:border-ios-blue/30 transition-all"
                                    disabled={chatMutation.isPending}
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!input.trim() || chatMutation.isPending}
                                    className="absolute right-2 w-9 h-9 flex items-center justify-center rounded-full bg-ios-blue text-white disabled:opacity-50 disabled:bg-neutral-300 dark:disabled:bg-neutral-700 transition-colors shadow-sm"
                                    aria-label="Send message"
                                >
                                    {chatMutation.isPending ? (
                                        <Loader2 size={18} className="animate-spin" />
                                    ) : (
                                        <Send size={16} className="-ml-0.5" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    );
}
