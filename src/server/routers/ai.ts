import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

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
                const chatCompletion = await groq.chat.completions.create({
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
  "note": "<string>"
}
CRITICAL: The "category" field MUST be exactly one of the following, do NOT invent categories: "Food & Dining", "Transport", "Shopping", "Entertainment", "Health", "Bills & Utilities", "Travel", "Groceries", "Education", or "Other".
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
                    return { amount: null, merchant: null, date: null, category: null, note: null };
                }
            } catch (error: any) {
                console.error("Groq API error:", error);
                throw new Error(`AI processing failed: ${error.message || "Unknown error"}`);
            }
        }),

    mapIcon: protectedProcedure
        .input(z.object({ query: z.string() }))
        .mutation(async ({ input }) => {
            const chatCompletion = await groq.chat.completions.create({
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
            const chatCompletion = await groq.chat.completions.create({
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
                content: `You are Agent Oasis, a helpful, intelligent, and concise AI financial assistant built into the Agent Oasis app. 
You help the user manage their cash, track their spending, and answer questions about their habits.
Use the provided financial context to give precise, personalized answers.
Be conversational but direct. Do not use markdown headers unless necessary, keep formatting simple.
If the user asks about something outside their financial data or app usage, nicely pivot back to their finances.

Context Information:
${contextData}`
            };

            const chatCompletion = await groq.chat.completions.create({
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
