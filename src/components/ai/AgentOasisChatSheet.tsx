"use client";

import { useState, useRef, useEffect } from "react";
import { Drawer } from "vaul";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, Sparkles, User, Bot } from "lucide-react";
import { trpc } from "@/trpc/client";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

interface AgentOasisChatSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

type Message = {
    id: string;
    role: "user" | "assistant";
    content: string;
};

export function AgentOasisChatSheet({ open, onOpenChange }: AgentOasisChatSheetProps) {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "initial",
            role: "assistant",
            content: "Hi! I'm Agent Floww. I've got your latest budget and spending context loaded up. What can I help you with today?"
        }
    ]);
    const [input, setInput] = useState("");

    const scrollRef = useRef<HTMLDivElement>(null);
    const chatMutation = trpc.ai.chat.useMutation();

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
            // We pass ALL conversation history to the backend so the model understands context
            // Except the IDs, just role and content
            const history = [...messages, userMessage].map(m => ({ role: m.role, content: m.content }));

            const response = await chatMutation.mutateAsync({ messages: history });

            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: "assistant",
                content: response.reply
            }]);
        } catch (error) {
            console.error("Chat error:", error);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: "assistant",
                content: "Sorry, I couldn't reach the servers right now. Please try again later."
            }]);
        }
    };

    const handleSendPreset = async (presetText: string) => {
        if (chatMutation.isPending) return;

        const userMessage: Message = { id: Date.now().toString(), role: "user", content: presetText };
        setMessages(prev => [...prev, userMessage]);

        try {
            const history = [...messages, userMessage].map(m => ({ role: m.role, content: m.content }));
            const response = await chatMutation.mutateAsync({ messages: history });

            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: "assistant",
                content: response.reply
            }]);
        } catch (error) {
            console.error("Chat error:", error);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: "assistant",
                content: "Sorry, I couldn't reach the servers right now. Please try again later."
            }]);
        }
    };

    return (
        <Drawer.Root open={open} onOpenChange={onOpenChange}>
            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" />
                <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 h-[90dvh] outline-none flex flex-col">
                    <Drawer.Title className="sr-only">Chat with Agent Floww</Drawer.Title>
                    <div className="bg-white dark:bg-[#1C1C1E] rounded-t-[28px] flex flex-col flex-1 h-full overflow-hidden">
                        {/* Drag Handle */}
                        <div className="flex justify-center pt-3 pb-0 flex-none">
                            <div className="w-10 h-1 rounded-full bg-[#E5E5EA] dark:bg-[#3A3A3C]" />
                        </div>

                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E5EA] dark:border-[#3A3A3C] flex-none">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-ios-blue/10 dark:bg-ios-blue-dark/20 flex items-center justify-center">
                                    <Sparkles size={16} className="text-ios-blue dark:text-ios-blue-dark" />
                                </div>
                                <div>
                                    <h2 className="text-[17px] font-semibold ios-text-primary leading-tight">Agent Floww</h2>
                                    <p className="text-[11px] ios-text-secondary font-medium uppercase tracking-wider">AI Assistant</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => onOpenChange(false)}
                                className="ios-text-secondary text-[15px] font-medium bg-[#F2F2F7] dark:bg-[#2C2C2E] px-3 py-1 rounded-full"
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
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        className={cn(
                                            "flex gap-3 max-w-[85%]",
                                            message.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1",
                                            message.role === "user"
                                                ? "bg-ios-blue text-white"
                                                : "bg-[#F2F2F7] dark:bg-[#2C2C2E] text-ios-primary"
                                        )}>
                                            {message.role === "user" ? <User size={16} /> : <Bot size={16} />}
                                        </div>

                                        <div className={cn(
                                            "px-4 py-3 rounded-2xl text-[15px] leading-relaxed",
                                            message.role === "user"
                                                ? "bg-ios-blue text-white rounded-tr-sm"
                                                : "bg-[#F2F2F7] dark:bg-[#2C2C2E] ios-text-primary rounded-tl-sm shadow-sm"
                                        )}>
                                            {message.role === "user" ? (
                                                <p className="whitespace-pre-wrap">{message.content}</p>
                                            ) : (
                                                <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1">
                                                    <ReactMarkdown>{message.content}</ReactMarkdown>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}

                                {chatMutation.isPending && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex gap-3 max-w-[85%] mr-auto"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-[#F2F2F7] dark:bg-[#2C2C2E] text-ios-primary flex items-center justify-center flex-shrink-0 mt-1">
                                            <Bot size={16} />
                                        </div>
                                        <div className="px-5 py-3 rounded-2xl bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-tl-sm flex items-center gap-1.5 h-[46px]">
                                            <motion.div className="w-1.5 h-1.5 bg-ios-secondary rounded-full" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} />
                                            <motion.div className="w-1.5 h-1.5 bg-ios-secondary rounded-full" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} />
                                            <motion.div className="w-1.5 h-1.5 bg-ios-secondary rounded-full" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Preset Questions Area */}
                        {messages.length === 1 && !chatMutation.isPending && (
                            <div className="px-4 pb-3 overflow-x-auto flex gap-2 no-scrollbar border-t border-[#E5E5EA] dark:border-[#3A3A3C] pt-3">
                                {[
                                    "How am I doing on my budgets?",
                                    "Where do I spend the most?",
                                    "What's my total income this month?",
                                    "Any tips to save more money?"
                                ].map((question, i) => (
                                    <button
                                        key={i}
                                        onClick={() => {
                                            if (!chatMutation.isPending) {
                                                handleSendPreset(question);
                                            }
                                        }}
                                        className="whitespace-nowrap px-4 py-2 rounded-full border border-[#E5E5EA] dark:border-[#3A3A3C] text-[13px] font-medium ios-text-secondary hover:ios-text-primary hover:border-ios-blue transition-colors flex-shrink-0"
                                    >
                                        {question}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Input Area */}
                        <div className="p-4 bg-white dark:bg-[#1C1C1E] border-t border-[#E5E5EA] dark:border-[#3A3A3C] pb-[env(safe-area-inset-bottom,16px)]">
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
                                    placeholder="Ask about your spending..."
                                    className="w-full pl-5 pr-14 py-3.5 bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-full outline-none ios-text-primary placeholder-[#8E8E93] dark:placeholder-[#636366] text-[15px]"
                                    disabled={chatMutation.isPending}
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!input.trim() || chatMutation.isPending}
                                    className="absolute right-2 w-9 h-9 flex items-center justify-center rounded-full bg-ios-blue text-white disabled:opacity-50 disabled:bg-ios-secondary transition-colors"
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
