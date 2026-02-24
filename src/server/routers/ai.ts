import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import Groq from "groq-sdk";

// Initialize Groq dynamically on request to ensure process.env.GROQ_API_KEY is available in serverless environments (like Netlify)
const getGroqClient = () => {
    if (!process.env.GROQ_API_KEY) {
        throw new Error("Missing GROQ_API_KEY environment variable");
    }
    return new Groq({ apiKey: process.env.GROQ_API_KEY });
};

export const aiRouter = router({
    scanReceipt: protectedProcedure
        .input(
            z.object({
                imageBase64: z.string(),
                mimeType: z.string().default("image/jpeg"),
            })
        )
        .mutation(async ({ input }) => {
            try {
                const chatCompletion = await getGroqClient().chat.completions.create({
                    messages: [
                        {
                            role: "user",
                            content: [
                                {
                                    type: "text",
                                    text: `Extract receipt data from this image. Return ONLY a raw JSON object. Do not include markdown formatting, backticks, or any conversational text.
{
  "amount": <number only>,
  "merchant": "<string>",
  "date": "<YYYY-MM-DD>",
  "category": "<string>",
  "paymentMethod": "<string>",
  "note": "<string>"
}
CRITICAL: The "category" field MUST be exactly one of the following, do NOT invent categories: "Food & Dining", "Transport", "Shopping", "Entertainment", "Health", "Bills & Utilities", "Travel", "Groceries", "Education", or "Other".
CRITICAL: The "paymentMethod" field MUST be exactly one of the following: "CASH", "CARD", "UPI", "BANK_TRANSFER", or "OTHER".
If a field is missing, use null.`
                                },
                                {
                                    type: "image_url",
                                    image_url: {
                                        url: `data:${input.mimeType};base64,${input.imageBase64}`,
                                    }
                                }
                            ]
                        }
                    ],
                    model: "meta-llama/llama-4-scout-17b-16e-instruct",
                    temperature: 0,
                });

                const text = chatCompletion.choices[0]?.message?.content || "{}";
                try {
                    return JSON.parse(text);
                } catch {
                    const jsonMatch = text.match(/\{[\s\S]*\}/);
                    if (jsonMatch) return JSON.parse(jsonMatch[0]);
                    return { amount: null, merchant: null, date: null, category: null, paymentMethod: null, note: null };
                }
            } catch (error: any) {
                console.error("Groq API error:", error);
                throw new Error(`AI processing failed: ${error.message || "Unknown error"}`);
            }
        }),

    scanDocument: protectedProcedure
        .input(
            z.object({
                imageBase64: z.string(),
                mimeType: z.string().default("image/jpeg"),
            })
        )
        .mutation(async ({ input }) => {
            const prompt = `Analyze this document carefully. Determine which of these types it is:
1. ITEMIZED BILL - a grocery receipt, restaurant bill, or shopping receipt with individual line items listed
2. EXPENSE - a single-amount receipt/bill without line items (utility bill, taxi receipt, etc.)
3. INCOME - a salary slip, invoice, or income document
4. BANK STATEMENT - a document listing multiple debit/credit transactions

Return ONLY a raw JSON object. No markdown, no backticks, no extra text.

If it is an ITEMIZED BILL (grocery, shopping, restaurant with line items):
{
  "type": "bill",
  "merchant": "<store/restaurant name>",
  "date": "<YYYY-MM-DD>",
  "paymentMethod": "<exactly one of: CASH, CARD, UPI, BANK_TRANSFER, OTHER>",
  "category": "<exactly one of: Food & Dining, Groceries, Shopping, Entertainment, Health, Other>",
  "items": [
    {
      "name": "<item name>",
      "quantity": <number, default 1>,
      "price": <total price for this item as number>
    }
  ],
  "total": <grand total as number>
}

If it is a single EXPENSE document (no line items):
{
  "type": "expense",
  "data": {
    "amount": <number only>,
    "merchant": "<string>",
    "date": "<YYYY-MM-DD>",
    "category": "<exactly one of: Food & Dining, Transport, Shopping, Entertainment, Health, Bills & Utilities, Travel, Groceries, Education, Other>",
    "paymentMethod": "<exactly one of: CASH, CARD, UPI, BANK_TRANSFER, OTHER>",
    "note": "<string>"
  }
}

If it is an INCOME document:
{
  "type": "income",
  "data": {
    "amount": <number only>,
    "source": "<employer name or income source>",
    "sourceType": "<exactly one of: Salary, Freelance, Investment, Business, Gifts, Refund>",
    "date": "<YYYY-MM-DD>",
    "note": "<string>"
  }
}

If it is a BANK STATEMENT with multiple transactions:
{
  "type": "statement",
  "data": [
    {
      "type": "<exactly 'expense' or 'income'>",
      "amount": <number only, always positive>,
      "title": "<merchant name for expense, or income source for income — be specific, e.g. 'Swiggy', 'Amazon', 'HDFC Bank Salary'>",
      "date": "<YYYY-MM-DD, the exact transaction date — CRITICAL, extract from each row>",
      "category": "<for expenses: MUST be exactly one of: 'Food & Dining', 'Transport', 'Shopping', 'Entertainment', 'Health', 'Bills & Utilities', 'Travel', 'Groceries', 'Education', 'Other'. For income: one of: 'Salary', 'Freelance', 'Investment', 'Business', 'Gifts', 'Refund'>",
      "paymentMethod": "<for expense only: exactly one of CASH, CARD, UPI, BANK_TRANSFER, OTHER. If unsure, use BANK_TRANSFER>"
    }
  ]
}

CATEGORIZATION RULES FOR BANK STATEMENTS:
- Swiggy, Zomato, Dunzo, restaurant names, café → "Food & Dining"
- Ola, Uber, Rapido, metro, petrol, fuel stations, BMTC, KSRTC → "Transport"
- Amazon, Flipkart, Myntra, Nykaa, Ajio, Meesho, retail stores → "Shopping"
- Netflix, Spotify, Amazon Prime, Disney+, cinema, gaming → "Entertainment"
- Apollo, Practo, pharmacy, hospital, medical, insurance premium → "Health"
- Electricity, water, gas, broadband, internet, phone bill, BESCOM, BSNL, Airtel, Jio, mobile recharge → "Bills & Utilities"
- Flights, hotel bookings, MakeMyTrip, Yatra, Airbnb, OYO → "Travel"
- Big Bazaar, DMart, More, grocery stores, vegetables → "Groceries"
- Fees, tuition, school, college, Udemy, Coursera, books → "Education"
- Bank charges, ATM withdrawals, processing fees, unknown → "Other"
- Salary credit, payroll, employer name → income type "Salary"
- Interest credit, dividend, stock gains → income type "Investment"
- Refund, cashback, reversal → income type "Refund"

CRITICAL RULES:
- Every transaction MUST have a date in YYYY-MM-DD format — this is mandatory.
- Debit entries (money going out) = expense. Credit entries (money coming in) = income.
- Do NOT merge multiple rows; extract each transaction separately.
- If paymentMethod is unclear from a bank statement, default to "BANK_TRANSFER".

If unreadable or none of the above:
{
  "type": "unknown",
  "reason": "<brief reason>"
}

IMPORTANT: Prefer 'bill' type over 'expense' whenever you can see individual line items in the document. If a field is missing, use null.`;

            const isPdf = input.mimeType === "application/pdf";

            try {
                let rawText: string;

                if (isPdf) {
                    // PDFs: decode to text, use text model with json_object for reliable output
                    const pdfRawText = Buffer.from(input.imageBase64, "base64").toString("utf-8");
                    const printable = pdfRawText.replace(/[^\x20-\x7E\n\t]/g, " ").replace(/\s{3,}/g, "  ").trim();
                    const truncated = printable.slice(0, 12000);
                    const pdfCompletion = await getGroqClient().chat.completions.create({
                        messages: [
                            {
                                role: "user",
                                content: `${prompt}\n\nDocument text:\n\n${truncated}`,
                            }
                        ],
                        model: "llama-3.3-70b-versatile",
                        temperature: 0,
                        response_format: { type: "json_object" }, // text-only models support this
                    });
                    rawText = pdfCompletion.choices[0]?.message?.content || "{}";
                } else {
                    // Images: vision model — response_format is NOT supported with image_url content
                    const imgCompletion = await getGroqClient().chat.completions.create({
                        messages: [
                            {
                                role: "user",
                                content: [
                                    { type: "text", text: prompt },
                                    {
                                        type: "image_url",
                                        image_url: {
                                            url: `data:${input.mimeType};base64,${input.imageBase64}`,
                                        }
                                    }
                                ]
                            }
                        ],
                        model: "meta-llama/llama-4-scout-17b-16e-instruct",
                        temperature: 0,
                        // DO NOT add response_format here — vision model doesn't support it
                    });
                    rawText = imgCompletion.choices[0]?.message?.content || "{}";
                }

                console.log("--- GROQ SCAN RESPONSE ---");
                console.log(rawText.slice(0, 600));
                console.log("--------------------------");

                try {
                    return JSON.parse(rawText);
                } catch {
                    // Strip markdown code fences if model wraps in ```json ... ```
                    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
                    if (jsonMatch) return JSON.parse(jsonMatch[0]);
                    return { type: "unknown", reason: "Could not parse the document into valid JSON." };
                }
            } catch (error: any) {
                console.error("Unified Document Scan API error:", error);
                throw new Error(`AI processing failed: ${error.message || "Unknown error"}`);
            }
        }),

    scanIncomeDoc: protectedProcedure
        .input(
            z.object({
                imageBase64: z.string(),
                mimeType: z.string().default("image/jpeg"),
            })
        )
        .mutation(async ({ input }) => {
            try {
                const chatCompletion = await getGroqClient().chat.completions.create({
                    messages: [
                        {
                            role: "user",
                            content: [
                                {
                                    type: "text",
                                    text: `Analyse this document image. First determine if it is an income-related document (e.g. salary slip, payslip, bank credit statement, freelance invoice, dividend notice, pension statement, or any document showing money received).

Return ONLY a raw JSON object. Do not include markdown formatting, backticks, or any conversational text.

If it IS an income document:
{
  "isIncomeDoc": true,
  "amount": <number, net/take-home amount if visible, else gross>,
  "source": "<employer name or income source, e.g. 'Infosys', 'Freelance - Upwork', 'Bank Interest'>",
  "sourceType": "<classify the income type. MUST be exactly one of: 'Salary', 'Freelance', 'Investment', 'Business', 'Gifts', 'Refund'. Use 'Salary' for payslips/salary slips. Use 'Freelance' for invoices/gig work. Use 'Investment' for dividends/interest. Use 'Business' for business revenue. Use 'Gifts' for gift/bonus payments. Use 'Refund' for refunds/cashbacks.>",
  "date": "<YYYY-MM-DD, the payslip or credit date>",
  "note": "<short descriptive note e.g. 'March 2025 Salary' or 'Q1 dividend payout'>"
}

If it is NOT an income document (e.g. it is an expense receipt, a random photo, a food bill, a utility bill, etc.):
{
  "isIncomeDoc": false,
  "reason": "<brief human-readable reason why this is not an income document, max 12 words>"
}

If a field is missing in an income doc, use null.`
                                },
                                {
                                    type: "image_url",
                                    image_url: {
                                        url: `data:${input.mimeType};base64,${input.imageBase64}`,
                                    }
                                }
                            ]
                        }
                    ],
                    model: "meta-llama/llama-4-scout-17b-16e-instruct",
                    temperature: 0,
                });

                const text = chatCompletion.choices[0]?.message?.content || "{}";
                try {
                    return JSON.parse(text);
                } catch {
                    const jsonMatch = text.match(/\{[\s\S]*\}/);
                    if (jsonMatch) return JSON.parse(jsonMatch[0]);
                    return { isIncomeDoc: false, reason: "Could not parse the document." };
                }
            } catch (error: any) {
                console.error("Income doc scan error:", error);
                throw new Error(`AI processing failed: ${error.message || "Unknown error"}`);
            }
        }),

    mapIcon: protectedProcedure
        .input(z.object({ query: z.string() }))
        .mutation(async ({ input }) => {
            const chatCompletion = await getGroqClient().chat.completions.create({
                messages: [
                    {
                        role: "user",
                        content: `Given the merchant or category name "${input.query}", return a JSON object with a single key "icon" containing the Lucide icon name (kebab-case) that best represents it.
Examples: "Starbucks" -> {"icon": "coffee"}, "Amazon" -> {"icon": "shopping-cart"}, "Netflix" -> {"icon": "film"}
Do not return any extra text.`
                    }
                ],
                model: "llama-3.1-8b-instant",
                temperature: 0,
                response_format: { type: "json_object" },
            });
            const text = chatCompletion.choices[0]?.message?.content || "{}";
            try {
                const parsed = JSON.parse(text);
                return { icon: parsed.icon || "circle" };
            } catch {
                return { icon: "circle" };
            }
        }),

    getInsights: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id!;
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const [expenses, budgets] = await Promise.all([
            ctx.db.expense.findMany({
                where: { userId, date: { gte: startOfMonth } },
                include: { category: true },
                orderBy: { amount: "desc" },
            }),
            ctx.db.budget.findMany({
                where: { userId },
                include: { category: true },
            }),
        ]);

        if (expenses.length === 0) {
            return {
                score: 85,
                insights: [
                    "No expenses logged this month yet — great start!",
                    "Set up budgets to track your spending goals.",
                    "Add your first expense to get personalized insights.",
                ],
                tip: "Start by adding your daily expenses to build a spending profile.",
                topCategories: [],
                totalSpent: 0,
            };
        }

        const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
        const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);

        const categoryMap = new Map<string, number>();
        expenses.forEach((e) => {
            const cat = e.category?.name ?? "Other";
            categoryMap.set(cat, (categoryMap.get(cat) ?? 0) + e.amount);
        });

        const topCategories = Array.from(categoryMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, amount]) => ({ name, amount }));

        const expenseSummary = topCategories
            .map(({ name, amount }) => `${name}: ₹${amount.toFixed(2)}`)
            .join(", ");

        const prompt = `You are a personal finance AI coach. Analyze this monthly spending data and provide insights:

Total spent: ₹${totalSpent.toFixed(2)}
Total budget: ${totalBudget > 0 ? `₹${totalBudget.toFixed(2)}` : "Not set"}
Budget utilization: ${totalBudget > 0 ? `${((totalSpent / totalBudget) * 100).toFixed(1)}%` : "N/A"}
Top spending categories: ${expenseSummary}
Number of transactions: ${expenses.length}

Return ONLY valid JSON (no markdown):
{
  "score": <number 0-100, financial health score>,
  "insights": [<string>, <string>, <string>],
  "tip": "<string, one actionable tip>"
}`;

        try {
            const chatCompletion = await getGroqClient().chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                model: "llama-3.1-8b-instant",
                temperature: 0,
                response_format: { type: "json_object" },
            });
            const text = chatCompletion.choices[0]?.message?.content || "{}";

            try {
                const parsed = JSON.parse(text);
                return { ...parsed, topCategories, totalSpent };
            } catch {
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    return { ...parsed, topCategories, totalSpent };
                }
                throw new Error("Failed to parse AI JSON");
            }
        } catch (error) {
            console.error("AI Insights Error:", error);
            return {
                score: 70,
                insights: [
                    "Experiencing high traffic right now.",
                    "Unable to analyze spending at this time.",
                    "Keep tracking your expenses!",
                ],
                tip: "Consistency in tracking leads to better financial health.",
                topCategories,
                totalSpent,
            };
        }
    }),

    chat: protectedProcedure
        .input(
            z.object({
                messages: z.array(z.object({
                    role: z.enum(["user", "assistant"]),
                    content: z.string()
                }))
            })
        )
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id!;
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

            // Fetch contextual data
            const [expenses, incomes, budgets] = await Promise.all([
                ctx.db.expense.findMany({
                    where: { userId, date: { gte: startOfMonth } },
                    include: { category: true },
                    orderBy: { date: "desc" },
                }),
                ctx.db.income.findMany({
                    where: { userId, date: { gte: startOfMonth } },
                    include: { category: true },
                    orderBy: { date: "desc" },
                }),
                ctx.db.budget.findMany({
                    where: { userId },
                    include: { category: true },
                }),
            ]);

            const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
            const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
            const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);

            let contextData = `User's Current Month Financials (Since ${startOfMonth.toLocaleDateString()}):
Total Income: ₹${totalIncome.toFixed(2)}
Total Spent: ₹${totalSpent.toFixed(2)}
Total Budget Configured: ₹${totalBudget.toFixed(2)}

Recent Expenses:
${expenses.slice(0, 10).map(e => `- ₹${e.amount} at ${e.merchant} (${e.category?.name || 'Uncategorized'}) on ${e.date.toLocaleDateString()}`).join('\n')}

Recent Incomes:
${incomes.slice(0, 5).map(i => `- ₹${i.amount} from ${i.source} on ${i.date.toLocaleDateString()}`).join('\n')}

Active Budgets:
${budgets.map(b => `- ${b.category?.name || 'Overall'}: ₹${b.amount}`).join('\n')}
`;

            const systemMessage = {
                role: "system" as const,
                content: `You are Agent Floww, a helpful, intelligent, and concise AI financial assistant built into the Floww app. 
You help the user manage their cash, track their spending, and answer questions about their habits.
Use the provided financial context to give precise, personalized answers.
Be conversational but direct. Do not use markdown headers unless necessary, keep formatting simple.
If the user asks about something outside their financial data or app usage, nicely pivot back to their finances.

Context Information:
${contextData}`
            };

            const chatCompletion = await getGroqClient().chat.completions.create({
                messages: [systemMessage, ...input.messages],
                model: "llama-3.1-8b-instant",
                temperature: 0.7,
                max_tokens: 500,
            });

            return {
                reply: chatCompletion.choices[0]?.message?.content || "I'm having trouble processing that right now."
            };
        }),
});
