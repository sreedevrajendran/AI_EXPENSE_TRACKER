/**
 * In-App Retrieval-Augmented Generation (RAG) Engine
 * 
 * Provides semantic, temporal, and lexical indexing across all user transactions
 * (expenses, incomes, budgets, categories) with calibrated relevance scoring,
 * citation extraction, and grounded prompt synthesis for Agent Floww.
 */

import { FinancialContext, formatDateReadable } from "./financialAssistant";
import { formatCurrency } from "../utils";

export interface RAGCitation {
    id: string;
    title: string;
    amount: number;
    date: string;
    category?: string;
    type: "expense" | "income";
    paymentMethod?: string;
}

export interface RAGRetrievalResult {
    query: string;
    matchedTransactions: RAGCitation[];
    citations: RAGCitation[];
    totalMatchedAmount: number;
    totalMatchedCount: number;
    categoryBreakdown: Record<string, number>;
    temporalContext: string | null;
    ragPrompt: string;
    directAnswer: string | null;
}

const MONTH_NAMES: Record<string, number> = {
    january: 0, jan: 0,
    february: 1, feb: 1,
    march: 2, mar: 2,
    april: 3, apr: 3,
    may: 4,
    june: 5, jun: 5,
    july: 6, jul: 6,
    august: 7, aug: 7,
    september: 8, sep: 8, sept: 8,
    october: 9, oct: 9,
    november: 10, nov: 10,
    december: 11, dec: 11,
};

interface ParsedFilters {
    queryTokens: string[];
    targetMonth?: number;
    targetYear?: number;
    targetType?: "expense" | "income" | "both";
    targetCategory?: string;
    targetPaymentMethod?: string;
    isHighest?: boolean;
    isLowest?: boolean;
    minAmount?: number;
    maxAmount?: number;
    rawQuery: string;
}

export function parseQueryFilters(query: string): ParsedFilters {
    const q = query.toLowerCase().trim();
    const tokens = q.replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(w => w.length >= 2);

    let targetMonth: number | undefined;
    for (const [mName, mIdx] of Object.entries(MONTH_NAMES)) {
        if (q.includes(mName)) {
            targetMonth = mIdx;
            break;
        }
    }

    let targetYear: number | undefined;
    const yearMatch = q.match(/\b(202[4-9])\b/);
    if (yearMatch) {
        targetYear = parseInt(yearMatch[1], 10);
    }

    let targetType: "expense" | "income" | "both" = "both";
    const hasIncomeWord = q.includes("income") || q.includes("received") || q.includes("credit") || q.includes("deposit") || q.includes("earned") || q.includes("salary");
    const hasExpenseWord = q.includes("expense") || q.includes("spent") || q.includes("spend") || q.includes("debit") || q.includes("paid") || q.includes("bought") || q.includes("purchase");

    if (hasIncomeWord && !hasExpenseWord) targetType = "income";
    else if (hasExpenseWord && !hasIncomeWord) targetType = "expense";

    // Min / Max amounts
    let minAmount: number | undefined;
    let maxAmount: number | undefined;

    const aboveMatch = q.match(/(?:above|over|more than|greater than|>)\s*(?:₹|\$|rs\.?)?\s*(\d+(?:\.\d{1,2})?)/);
    if (aboveMatch) minAmount = parseFloat(aboveMatch[1]);

    const underMatch = q.match(/(?:under|below|less than|<)\s*(?:₹|\$|rs\.?)?\s*(\d+(?:\.\d{1,2})?)/);
    if (underMatch) maxAmount = parseFloat(underMatch[1]);

    // Payment methods
    let targetPaymentMethod: string | undefined;
    if (q.includes("upi") || q.includes("gpay") || q.includes("phonepe") || q.includes("paytm")) targetPaymentMethod = "UPI";
    else if (q.includes("card") || q.includes("credit card") || q.includes("debit card")) targetPaymentMethod = "CARD";
    else if (q.includes("cash")) targetPaymentMethod = "CASH";
    else if (q.includes("bank") || q.includes("transfer") || q.includes("neft") || q.includes("rtgs")) targetPaymentMethod = "BANK_TRANSFER";

    const isHighest = q.includes("highest") || q.includes("largest") || q.includes("maximum") || q.includes("max") || q.includes("biggest") || q.includes("top");
    const isLowest = q.includes("lowest") || q.includes("smallest") || q.includes("minimum") || q.includes("min") || q.includes("cheapest");

    return {
        queryTokens: tokens,
        targetMonth,
        targetYear,
        targetType,
        targetPaymentMethod,
        isHighest,
        isLowest,
        minAmount,
        maxAmount,
        rawQuery: query,
    };
}

/**
 * Executes multi-factor RAG retrieval across transactions with entity scoring and temporal grounding
 */
export function retrieveFinancialContext(query: string, data: FinancialContext): RAGRetrievalResult {
    const filters = parseQueryFilters(query);
    const { expenses = [], incomes = [], categories = [] } = data;

    interface ScoredTx {
        citation: RAGCitation;
        score: number;
    }

    const scoredItems: ScoredTx[] = [];
    const queryLower = query.toLowerCase();

    // 1. Score Expenses
    if (filters.targetType === "expense" || filters.targetType === "both") {
        for (const exp of expenses) {
            let score = 0;
            const merchantLower = (exp.merchant || "").toLowerCase();
            const catNameLower = (exp.category?.name || "").toLowerCase();
            const noteLower = (exp.note || "").toLowerCase();
            const date = new Date(exp.date);

            // Filter bounds
            if (filters.minAmount !== undefined && (exp.amount || 0) < filters.minAmount) continue;
            if (filters.maxAmount !== undefined && (exp.amount || 0) > filters.maxAmount) continue;

            // Date matching
            if (filters.targetMonth !== undefined && date.getMonth() === filters.targetMonth) {
                score += 15;
            }
            if (filters.targetYear !== undefined && date.getFullYear() === filters.targetYear) {
                score += 10;
            }

            // Payment method
            if (filters.targetPaymentMethod && exp.paymentMethod?.toUpperCase().includes(filters.targetPaymentMethod)) {
                score += 8;
            }

            // Exact merchant match
            if (merchantLower && queryLower.includes(merchantLower)) {
                score += 40;
            } else if (merchantLower) {
                for (const tok of filters.queryTokens) {
                    if (merchantLower.includes(tok)) score += 8;
                }
            }

            // Category matching
            if (catNameLower && queryLower.includes(catNameLower)) {
                score += 20;
            }

            if (noteLower) {
                for (const tok of filters.queryTokens) {
                    if (noteLower.includes(tok)) score += 5;
                }
            }

            if (score > 0 || filters.isHighest || filters.isLowest || filters.targetMonth !== undefined) {
                scoredItems.push({
                    citation: {
                        id: exp.id,
                        title: exp.merchant,
                        amount: exp.amount,
                        date: exp.date,
                        category: exp.category?.name || "Expense",
                        type: "expense",
                        paymentMethod: exp.paymentMethod,
                    },
                    score,
                });
            }
        }
    }

    // 2. Score Incomes
    if (filters.targetType === "income" || filters.targetType === "both") {
        for (const inc of incomes) {
            let score = 0;
            const sourceLower = (inc.source || "").toLowerCase();
            const catNameLower = (inc.category?.name || "").toLowerCase();
            const date = new Date(inc.date);

            // Filter bounds
            if (filters.minAmount !== undefined && (inc.amount || 0) < filters.minAmount) continue;
            if (filters.maxAmount !== undefined && (inc.amount || 0) > filters.maxAmount) continue;

            // Date matching
            if (filters.targetMonth !== undefined && date.getMonth() === filters.targetMonth) {
                score += 15;
            }
            if (filters.targetYear !== undefined && date.getFullYear() === filters.targetYear) {
                score += 10;
            }

            // Payment method
            if (filters.targetPaymentMethod && inc.paymentMethod?.toUpperCase().includes(filters.targetPaymentMethod)) {
                score += 8;
            }

            // Exact source match
            if (sourceLower && queryLower.includes(sourceLower)) {
                score += 40;
            } else if (sourceLower) {
                for (const tok of filters.queryTokens) {
                    if (sourceLower.includes(tok)) score += 8;
                }
            }

            // Category matching
            if (catNameLower && queryLower.includes(catNameLower)) {
                score += 20;
            }

            if (score > 0 || filters.isHighest || filters.isLowest || filters.targetMonth !== undefined) {
                scoredItems.push({
                    citation: {
                        id: inc.id,
                        title: inc.source,
                        amount: inc.amount,
                        date: inc.date,
                        category: inc.category?.name || "Income",
                        type: "income",
                        paymentMethod: inc.paymentMethod || "UPI",
                    },
                    score,
                });
            }
        }
    }

    // 3. Sorting & Ranking
    if (filters.isHighest) {
        scoredItems.sort((a, b) => (b.citation.amount || 0) - (a.citation.amount || 0));
    } else if (filters.isLowest) {
        scoredItems.sort((a, b) => (a.citation.amount || 0) - (b.citation.amount || 0));
    } else {
        scoredItems.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return new Date(b.citation.date).getTime() - new Date(a.citation.date).getTime();
        });
    }

    const matchedCitations = scoredItems.map(s => s.citation);
    const topMatches = matchedCitations.slice(0, 30);

    const formatCurrencyINR = (val: number) => formatCurrency(val, false, data.currency);
    const totalMatchedAmount = topMatches.reduce((s, c) => s + (c.amount || 0), 0);
    const categoryBreakdown: Record<string, number> = {};
    topMatches.forEach(c => {
        const cat = c.category || "Other";
        categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + (c.amount || 0);
    });

    // Temporal context label
    let temporalContext: string | null = null;
    if (filters.targetMonth !== undefined) {
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        temporalContext = `${monthNames[filters.targetMonth]} ${filters.targetYear || ""}`.trim();
    }

    // Grounded RAG Prompt snippet for LLM
    let ragPrompt = `=== RETRIEVED RELEVANT TRANSACTIONS (RAG) ===\n`;
    ragPrompt += `Matched Items Count: ${topMatches.length}\n`;
    ragPrompt += `Total Sum of Matched: ${formatCurrencyINR(totalMatchedAmount)}\n\n`;

    if (topMatches.length > 0) {
        ragPrompt += topMatches.slice(0, 20).map((c, i) => {
            return `${i + 1}. [${c.type.toUpperCase()}] ${formatCurrencyINR(c.amount)} · "${c.title}" (${c.category || "General"}) on ${formatDateReadable(c.date)}${c.paymentMethod ? ` via ${c.paymentMethod}` : ""}`;
        }).join("\n");
    } else {
        ragPrompt += "No transactions matching specific keywords found in database.";
    }

    // Direct answer synthesis (used when offline or for instant precision)
    let directAnswer: string | null = null;
    if (topMatches.length > 0) {
        const isExpense = filters.targetType === "expense";
        const isIncome = filters.targetType === "income";

        if (filters.isHighest) {
            const top = topMatches[0];
            directAnswer = `Your highest ${top.type} found was **${formatCurrencyINR(top.amount)}** for **${top.title}** on **${formatDateReadable(top.date)}** (${top.category}).`;
        } else if (filters.targetMonth !== undefined) {
            directAnswer = `In **${temporalContext}**, found **${topMatches.length}** transactions totaling **${formatCurrencyINR(totalMatchedAmount)}**:\n\n` +
                topMatches.slice(0, 5).map(c => `- **${formatCurrencyINR(c.amount)}** · ${c.title} (${formatDateReadable(c.date)})`).join("\n");
        } else if (topMatches.length === 1) {
            const t = topMatches[0];
            directAnswer = `Found 1 matching transaction: **${formatCurrencyINR(t.amount)}** for **${t.title}** on **${formatDateReadable(t.date)}** (${t.category}).`;
        } else {
            directAnswer = `Found **${topMatches.length}** relevant transactions totaling **${formatCurrencyINR(totalMatchedAmount)}**:\n\n` +
                topMatches.slice(0, 5).map(c => `- **${formatCurrencyINR(c.amount)}** · ${c.title} (${formatDateReadable(c.date)})`).join("\n");
        }
    }

    return {
        query,
        matchedTransactions: matchedCitations,
        citations: topMatches.slice(0, 10), // Return top 10 for UI chips
        totalMatchedAmount,
        totalMatchedCount: topMatches.length,
        categoryBreakdown,
        temporalContext,
        ragPrompt,
        directAnswer,
    };
}
