import { retrieveFinancialContext } from "./ragEngine";
import { formatCurrency } from "../utils";

export interface FinancialContext {
    expenses: Array<{
        id: string;
        amount: number;
        merchant: string;
        date: string;
        categoryId?: string | null;
        category?: { name: string; icon?: string; color?: string } | null;
        paymentMethod?: string;
        note?: string | null;
    }>;
    incomes: Array<{
        id: string;
        amount: number;
        source: string;
        date: string;
        categoryId?: string | null;
        category?: { name: string; icon?: string; color?: string } | null;
        paymentMethod?: string;
        note?: string | null;
    }>;
    budgets: Array<{
        id: string;
        amount: number;
        category?: { name: string } | null;
    }>;
    categories: Array<{
        id: string;
        name: string;
    }>;
    currency?: string;
}

export function formatCurrencyINR(val: number, currencyCode?: string): string {
    return formatCurrency(val, false, currencyCode);
}

export function formatDateReadable(dateStr: string): string {
    if (!dateStr) return "Unknown Date";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
    "Food & Dining": ["food", "dining", "restaurant", "swiggy", "zomato", "cafe", "coffee", "lunch", "dinner", "breakfast", "snack", "pizza", "burger", "mcdonald", "kfc", "domino", "starbucks"],
    "Groceries": ["grocery", "groceries", "supermarket", "blinkit", "zepto", "instamart", "vegetables", "fruits", "milk", "bread", "provision", "mart", "store"],
    "Transport": ["transport", "cab", "uber", "ola", "taxi", "fuel", "petrol", "diesel", "auto", "metro", "bus", "train", "flight", "toll", "parking"],
    "Shopping": ["shopping", "clothes", "clothing", "dress", "shoes", "amazon", "flipkart", "myntra", "meesho", "mall", "electronics", "apparel"],
    "Bills & Utilities": ["bill", "bills", "electricity", "water", "wifi", "internet", "recharge", "mobile", "utility", "utilities", "rent", "broadband", "dth"],
    "Entertainment": ["entertainment", "movie", "cinema", "theatre", "netflix", "prime", "hotstar", "spotify", "game", "gaming", "playstation", "steam"],
    "Health": ["health", "hospital", "clinic", "doctor", "medicine", "pharmacy", "medical", "gym", "fitness", "apollo", "pharmeasy"],
    "Travel": ["travel", "hotel", "resort", "vacation", "trip", "tour", "makemytrip", "airbnb", "irctc", "indigo"],
    "Education": ["education", "course", "college", "school", "tuition", "books", "udemy", "coursera", "exam"],
    "Investments": ["investment", "investments", "mutual fund", "stocks", "sip", "zerodha", "groww", "angel", "trading", "shares", "deposit"],
    "Salary": ["salary", "payroll", "wages", "stipend"],
    "UPI Transfer": ["upi transfer", "upi", "gpay", "phonepe", "paytm", "transfer to", "sent to"],
    "Transfers": ["transfer", "transfers", "bank transfer", "self transfer", "neft", "rtgs", "imps"],
    "Cashback & Rewards": ["cashback", "reward", "rewards", "bonus"],
    "Interest & Dividends": ["interest", "dividend", "dividends", "int.pd", "int pd"],
    "Refunds": ["refund", "refunds", "reversed", "reversal"]
};

export function answerFinancialQuery(query: string, data: FinancialContext): string | null {
    if (!query || query.trim().length === 0) return null;
    const q = query.toLowerCase().trim();

    const { expenses = [], incomes = [], budgets = [], currency } = data;
    const formatCurrencyINR = (val: number) => formatCurrency(val, false, currency);

    const totalIncome = incomes.reduce((sum, i) => sum + (i.amount || 0), 0);
    const totalSpent = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const netBalance = totalIncome - totalSpent;

    const isHighest = q.includes("highest") || q.includes("largest") || q.includes("maximum") || q.includes("biggest") || q.includes("max") || q.includes("top") || q.includes("best") || q.includes("most expensive") || q.includes("peak");
    const isLowest = q.includes("lowest") || q.includes("smallest") || q.includes("minimum") || q.includes("min") || q.includes("least") || q.includes("cheapest");
    const isIncomeIntent = q.includes("income") || q.includes("received") || q.includes("credit") || q.includes("deposit") || q.includes("earned") || q.includes("earning") || q.includes("gain");
    const isExpenseIntent = q.includes("expense") || q.includes("spent") || q.includes("spend") || q.includes("payment") || q.includes("debit") || q.includes("purchase") || q.includes("bought") || q.includes("cost") || q.includes("paid");

    // 1. Highest Income
    if (isHighest && isIncomeIntent && !isExpenseIntent) {
        if (incomes.length === 0) {
            return "No income transactions have been recorded yet.";
        }
        const sortedIncomes = [...incomes].sort((a, b) => (b.amount || 0) - (a.amount || 0));
        const top = sortedIncomes[0];
        const top3 = sortedIncomes.slice(0, 3);

        let msg = `Your highest income received was **${formatCurrencyINR(top.amount)}** from **${top.source}** on **${formatDateReadable(top.date)}**`;
        if (top.category?.name) msg += ` (*${top.category.name}*)`;
        msg += ".\n\n";

        if (sortedIncomes.length > 1) {
            msg += "**Top Recorded Incomes:**\n";
            top3.forEach((inc, idx) => {
                msg += `${idx + 1}. **${formatCurrencyINR(inc.amount)}** — ${inc.source} (${formatDateReadable(inc.date)})\n`;
            });
        }
        return msg.trim();
    }

    // 2. Highest Expense
    if (isHighest && (isExpenseIntent || (!isIncomeIntent && (q.includes("spent") || q.includes("purchase") || q.includes("paid") || q.includes("bought") || q.includes("cost"))))) {
        if (expenses.length === 0) {
            return "No expenses have been recorded yet.";
        }
        const sortedExpenses = [...expenses].sort((a, b) => (b.amount || 0) - (a.amount || 0));
        const top = sortedExpenses[0];
        const top3 = sortedExpenses.slice(0, 3);

        let msg = `Your highest single expense was **${formatCurrencyINR(top.amount)}** at **${top.merchant}** on **${formatDateReadable(top.date)}**`;
        if (top.category?.name) msg += ` (*${top.category.name}*)`;
        if (top.paymentMethod) msg += ` via ${top.paymentMethod}`;
        msg += ".\n\n";

        if (sortedExpenses.length > 1) {
            msg += "**Top Recorded Expenses:**\n";
            top3.forEach((exp, idx) => {
                msg += `${idx + 1}. **${formatCurrencyINR(exp.amount)}** — ${exp.merchant} (${formatDateReadable(exp.date)}) · ${exp.category?.name || "Expense"}\n`;
            });
        }
        return msg.trim();
    }

    // 3. Lowest Income
    if (isLowest && isIncomeIntent) {
        const validIncomes = incomes.filter(i => (i.amount || 0) > 0).sort((a, b) => a.amount - b.amount);
        if (validIncomes.length === 0) return "No income transactions found.";
        const low = validIncomes[0];
        return `Your smallest recorded income was **${formatCurrencyINR(low.amount)}** from **${low.source}** on **${formatDateReadable(low.date)}**.`;
    }

    // 4. Lowest Expense
    if (isLowest && isExpenseIntent) {
        const validExpenses = expenses.filter(e => (e.amount || 0) > 0).sort((a, b) => a.amount - b.amount);
        if (validExpenses.length === 0) return "No expense transactions found.";
        const low = validExpenses[0];
        return `Your smallest recorded expense was **${formatCurrencyINR(low.amount)}** at **${low.merchant}** on **${formatDateReadable(low.date)}** (${low.category?.name || "Other"}).`;
    }

    // 5. Category-Specific Queries
    for (const [catName, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        const matchedKeyword = keywords.find(kw => q.includes(kw));
        if (matchedKeyword) {
            // Check if user is asking about spending or income in this category
            const isCatIncome = catName === "Salary" || catName === "Cashback & Rewards" || catName === "Interest & Dividends" || catName === "Refunds";

            if (isCatIncome || (isIncomeIntent && !isExpenseIntent)) {
                const catIncomes = incomes.filter(i => 
                    i.category?.name?.toLowerCase() === catName.toLowerCase() ||
                    i.source.toLowerCase().includes(matchedKeyword)
                );
                if (catIncomes.length > 0) {
                    const catTotal = catIncomes.reduce((s, i) => s + (i.amount || 0), 0);
                    const sorted = [...catIncomes].sort((a, b) => b.amount - a.amount);
                    let msg = `You have received a total of **${formatCurrencyINR(catTotal)}** under **${catName}** across **${catIncomes.length}** transactions.\n\n`;
                    msg += `- **Highest:** ${formatCurrencyINR(sorted[0].amount)} (${sorted[0].source} on ${formatDateReadable(sorted[0].date)})\n`;
                    msg += `- **Recent Transactions:**\n`;
                    sorted.slice(0, 3).forEach(i => {
                        msg += `  - ${formatCurrencyINR(i.amount)} from ${i.source} (${formatDateReadable(i.date)})\n`;
                    });
                    return msg.trim();
                }
            }

            const catExpenses = expenses.filter(e => 
                e.category?.name?.toLowerCase() === catName.toLowerCase() ||
                e.merchant.toLowerCase().includes(matchedKeyword)
            );

            if (catExpenses.length > 0) {
                const catTotal = catExpenses.reduce((s, e) => s + (e.amount || 0), 0);
                const avg = catTotal / catExpenses.length;
                const sorted = [...catExpenses].sort((a, b) => b.amount - a.amount);
                const recent = [...catExpenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 3);

                let msg = `You have spent a total of **${formatCurrencyINR(catTotal)}** on **${catName}** across **${catExpenses.length}** transactions (avg **${formatCurrencyINR(avg)}**/transaction).\n\n`;
                msg += `- **Highest in ${catName}:** ${formatCurrencyINR(sorted[0].amount)} at ${sorted[0].merchant} (${formatDateReadable(sorted[0].date)})\n`;
                msg += `- **Recent ${catName} Expenses:**\n`;
                recent.forEach(e => {
                    msg += `  - ${formatCurrencyINR(e.amount)} at ${e.merchant} (${formatDateReadable(e.date)})\n`;
                });
                return msg.trim();
            }
        }
    }

    // 6. Specific Merchant Search (e.g. Swiggy, Amazon, Uber, Zomato, Starbucks, etc.)
    // Extract candidate words that could be merchant names
    const queryWords = q.split(/\s+/).filter(w => w.length >= 3 && !["what", "when", "where", "which", "much", "many", "show", "tell", "spent", "spend", "paid", "gave", "total", "with", "from", "have", "this", "that", "highest", "lowest", "recent", "about", "transaction", "transactions"].includes(w));
    for (const word of queryWords) {
        const matchingExpenses = expenses.filter(e => e.merchant.toLowerCase().includes(word));
        if (matchingExpenses.length > 0) {
            const mTotal = matchingExpenses.reduce((s, e) => s + (e.amount || 0), 0);
            const mAvg = mTotal / matchingExpenses.length;
            const topExp = [...matchingExpenses].sort((a, b) => b.amount - a.amount)[0];
            const recent = [...matchingExpenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 3);

            let msg = `You have spent **${formatCurrencyINR(mTotal)}** across **${matchingExpenses.length}** transactions matching "**${word}**".\n\n`;
            msg += `- **Average:** ${formatCurrencyINR(mAvg)} per transaction\n`;
            msg += `- **Largest:** ${formatCurrencyINR(topExp.amount)} on ${formatDateReadable(topExp.date)} (${topExp.merchant})\n`;
            msg += `- **Recent:**\n`;
            recent.forEach(e => {
                msg += `  - ${formatCurrencyINR(e.amount)} on ${formatDateReadable(e.date)} (${e.merchant})\n`;
            });
            return msg.trim();
        }

        const matchingIncomes = incomes.filter(i => i.source.toLowerCase().includes(word));
        if (matchingIncomes.length > 0) {
            const mTotal = matchingIncomes.reduce((s, i) => s + (i.amount || 0), 0);
            let msg = `You have received **${formatCurrencyINR(mTotal)}** across **${matchingIncomes.length}** income transactions matching "**${word}**".\n\n`;
            matchingIncomes.slice(0, 3).forEach(i => {
                msg += `- ${formatCurrencyINR(i.amount)} from ${i.source} on ${formatDateReadable(i.date)}\n`;
            });
            return msg.trim();
        }
    }

    // 7. Payment Method Breakdown (UPI, Card, Cash, Net Banking)
    if (q.includes("upi") || q.includes("gpay") || q.includes("phonepe") || q.includes("paytm")) {
        const upiExp = expenses.filter(e => e.paymentMethod === "UPI" || e.merchant.toLowerCase().includes("upi"));
        const upiInc = incomes.filter(i => i.source.toLowerCase().includes("upi") || i.category?.name === "UPI Transfer");
        const upiExpTotal = upiExp.reduce((s, e) => s + (e.amount || 0), 0);
        const upiIncTotal = upiInc.reduce((s, i) => s + (i.amount || 0), 0);

        let msg = `**UPI Summary:**\n`;
        msg += `- **UPI Payments Sent:** ${formatCurrencyINR(upiExpTotal)} (${upiExp.length} transactions)\n`;
        msg += `- **UPI Payments Received:** ${formatCurrencyINR(upiIncTotal)} (${upiInc.length} transactions)\n\n`;
        if (upiExp.length > 0) {
            const topUpi = [...upiExp].sort((a, b) => b.amount - a.amount)[0];
            msg += `Highest UPI payment was **${formatCurrencyINR(topUpi.amount)}** to **${topUpi.merchant}** on ${formatDateReadable(topUpi.date)}.`;
        }
        return msg.trim();
    }

    if (q.includes("card") || q.includes("debit") || q.includes("credit")) {
        const cardExp = expenses.filter(e => e.paymentMethod === "CARD" || e.paymentMethod === "DEBIT_CARD" || e.paymentMethod === "CREDIT_CARD");
        const cardTotal = cardExp.reduce((s, e) => s + (e.amount || 0), 0);
        let msg = `You've made **${cardExp.length}** card transactions totaling **${formatCurrencyINR(cardTotal)}**.\n\n`;
        cardExp.slice(0, 3).forEach(e => {
            msg += `- ${formatCurrencyINR(e.amount)} at ${e.merchant} (${formatDateReadable(e.date)})\n`;
        });
        return msg.trim();
    }

    // 8. Recent Transactions / History
    if (q.includes("recent") || q.includes("history") || q.includes("last") || q.includes("latest")) {
        const recentExpenses = [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
        const recentIncomes = [...incomes].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 3);

        let msg = "**Recent Transactions:**\n\n";
        msg += "**Expenses:**\n";
        if (recentExpenses.length === 0) msg += "No expenses found.\n";
        else {
            recentExpenses.forEach(e => {
                msg += `- **${formatCurrencyINR(e.amount)}** · ${e.merchant} (${formatDateReadable(e.date)})\n`;
            });
        }

        msg += "\n**Incomes:**\n";
        if (recentIncomes.length === 0) msg += "No incomes found.\n";
        else {
            recentIncomes.forEach(i => {
                msg += `- **${formatCurrencyINR(i.amount)}** · ${i.source} (${formatDateReadable(i.date)})\n`;
            });
        }
        return msg.trim();
    }

    // 9. Transaction Counts
    if (q.includes("how many") || q.includes("count") || q.includes("number of")) {
        return `You have **${expenses.length + incomes.length}** total transactions recorded:\n- **${expenses.length}** Expenses (Total: ${formatCurrencyINR(totalSpent)})\n- **${incomes.length}** Incomes (Total: ${formatCurrencyINR(totalIncome)})\n- **Net Balance:** ${formatCurrencyINR(netBalance)}`;
    }

    // 10. Financial Summary / Balance / Total
    if (q.includes("total") || q.includes("balance") || q.includes("net") || q.includes("savings") || q.includes("summary") || q.includes("how am i doing") || q.includes("overview")) {
        const catMap = new Map<string, number>();
        expenses.forEach(e => {
            const c = e.category?.name || "Other";
            catMap.set(c, (catMap.get(c) || 0) + (e.amount || 0));
        });
        const topCat = [...catMap.entries()].sort((a, b) => b[1] - a[1])[0];

        let msg = `Here is your complete financial summary:\n\n`;
        msg += `- **Total Income:** ${formatCurrencyINR(totalIncome)}\n`;
        msg += `- **Total Spent:** ${formatCurrencyINR(totalSpent)}\n`;
        msg += `- **Net Balance:** ${formatCurrencyINR(netBalance)}\n`;
        msg += `- **Total Transactions:** ${expenses.length + incomes.length} (${expenses.length} expenses, ${incomes.length} incomes)\n`;
        if (topCat) {
            msg += `- **Top Category:** ${topCat[0]} (${formatCurrencyINR(topCat[1])})\n`;
        }
        return msg.trim();
    }

    // 11. In-App RAG semantic search across all transactions
    const ragResult = retrieveFinancialContext(query, data);
    if (ragResult.directAnswer && ragResult.totalMatchedCount > 0) {
        return ragResult.directAnswer;
    }

    // 12. Conversational Default / Help
    let helpMsg = `Hi! I'm Agent Floww. Here's a snapshot of your account:\n\n`;
    helpMsg += `- **Total Income:** ${formatCurrencyINR(totalIncome)}\n`;
    helpMsg += `- **Total Spent:** ${formatCurrencyINR(totalSpent)}\n`;
    helpMsg += `- **Net Balance:** ${formatCurrencyINR(netBalance)} across **${expenses.length + incomes.length}** transactions.\n\n`;
    helpMsg += `You can ask me specific questions like:\n`;
    helpMsg += `- *"What is my highest income received?"*\n`;
    helpMsg += `- *"What was my biggest expense?"*\n`;
    helpMsg += `- *"How much did I spend in December?"*\n`;
    helpMsg += `- *"Did I transfer any money to Jayachithra Pl?"*\n`;
    helpMsg += `- *"Show my recent UPI transactions"*\n`;
    helpMsg += `- *"Add expense 45 for groceries with UPI"*`;
    return helpMsg;
}

export function buildRichPromptContext(data: FinancialContext): string {
    const { expenses = [], incomes = [], budgets = [], currency } = data;
    const formatCurrencyINR = (val: number) => formatCurrency(val, false, currency);

    const totalIncome = incomes.reduce((sum, i) => sum + (i.amount || 0), 0);
    const totalSpent = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const netBalance = totalIncome - totalSpent;

    const sortedExpenses = [...expenses].sort((a, b) => (b.amount || 0) - (a.amount || 0));
    const sortedIncomes = [...incomes].sort((a, b) => (b.amount || 0) - (a.amount || 0));
    const recentExpenses = [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 15);
    const recentIncomes = [...incomes].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

    const catMap = new Map<string, number>();
    expenses.forEach(e => {
        const c = e.category?.name || "Other";
        catMap.set(c, (catMap.get(c) || 0) + (e.amount || 0));
    });
    const topCategories = [...catMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);

    return `=== USER FINANCIAL RECORDS ===
Total Income: ${formatCurrencyINR(totalIncome)} (${incomes.length} records)
Total Spent: ${formatCurrencyINR(totalSpent)} (${expenses.length} records)
Net Balance: ${formatCurrencyINR(netBalance)}

TOP 5 HIGHEST INCOMES:
${sortedIncomes.slice(0, 5).map((i, idx) => `${idx + 1}. ${formatCurrencyINR(i.amount)} from "${i.source}" on ${formatDateReadable(i.date)} (${i.category?.name || "Income"})`).join("\n")}

TOP 5 HIGHEST EXPENSES:
${sortedExpenses.slice(0, 5).map((e, idx) => `${idx + 1}. ${formatCurrencyINR(e.amount)} at "${e.merchant}" on ${formatDateReadable(e.date)} (${e.category?.name || "Expense"}${e.paymentMethod ? ` via ${e.paymentMethod}` : ""})`).join("\n")}

SPENDING BY TOP CATEGORIES:
${topCategories.map(([cat, amt]) => `- ${cat}: ${formatCurrencyINR(amt)}`).join("\n")}

RECENT EXPENSES (Latest first):
${recentExpenses.map(e => `- ${formatCurrencyINR(e.amount)} at ${e.merchant} (${e.category?.name || "Expense"}) on ${formatDateReadable(e.date)}`).join("\n")}

RECENT INCOMES (Latest first):
${recentIncomes.map(i => `- ${formatCurrencyINR(i.amount)} from ${i.source} on ${formatDateReadable(i.date)}`).join("\n")}

ACTIVE BUDGETS:
${budgets.map(b => `- ${b.category?.name || "Overall"}: ${formatCurrencyINR(b.amount)}`).join("\n")}

=== AGENT FLOWW FEW-SHOT TRAINING EXEMPLARS ===
User: "What is my highest income received?"
Assistant: "Your highest income received was ₹25,000.00 from 'Salary Credit' on 31 Mar 2026."

User: "How much did I spend in December?"
Assistant: "In December 2025, you recorded 92 expenses totaling ₹25,006.56, primarily on Food & Dining and Shopping."

User: "Did I transfer any money to Jayachithra?"
Assistant: "Yes, you have 3 UPI transfers to Jayachithra Pl totaling ₹450.00 (₹200.00 on 30 Mar 2026, ₹200.00 on 28 Mar 2026, and ₹50.00 on 31 Mar 2026)."

User: "What was my highest expense?"
Assistant: "Your biggest expense was ₹15,000.00 for 'Rent Payment' on 01 Dec 2025 (Bills & Utilities via Bank Transfer)."
`;
}
