import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini dynamically on request to ensure process.env.GEMINI_API_KEY is available in serverless environments
const getGeminiClient = () => {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("Missing GEMINI_API_KEY environment variable");
    }
    return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
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
                const prompt = `Extract receipt data from this image. Return ONLY a raw JSON object. Do not include markdown formatting, backticks, or any conversational text.
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
If a field is missing, use null.`;

                const ai = getGeminiClient();
                const response = await ai.models.generateContent({
                    model: "gemini-2.5-flash",
                    contents: [
                        prompt,
                        {
                            inlineData: {
                                data: input.imageBase64,
                                mimeType: input.mimeType,
                            },
                        },
                    ],
                    config: {
                        temperature: 0,
                        responseMimeType: "application/json",
                    },
                });

                const text = response.text || "{}";
                try {
                    return JSON.parse(text);
                } catch {
                    const jsonMatch = text.match(/\{[\s\S]*\}/);
                    if (jsonMatch) return JSON.parse(jsonMatch[0]);
                    return { amount: null, merchant: null, date: null, category: null, paymentMethod: null, note: null };
                }
            } catch (error: any) {
                console.error("Gemini API error:", error);
                throw new Error("Failed to process the receipt. Please try again.");
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

If it is a general EXPENSE:
{
  "type": "expense",
  "merchant": "<name>",
  "date": "<YYYY-MM-DD>",
  "amount": <number>,
  "paymentMethod": "<exactly one of: CASH, CARD, UPI, BANK_TRANSFER, OTHER>",
  "category": "<exactly one of: Food & Dining, Transport, Entertainment, Bills & Utilities, Travel, Other>"
}

If it is INCOME:
{
  "type": "income",
  "source": "<employer/sender name>",
  "date": "<YYYY-MM-DD>",
  "amount": <number>
}

If it is a BANK STATEMENT:
{
  "type": "statement",
  "bankName": "<name>",
  "statementPeriod": "<e.g., Jan 2024>",
  "transactions": [
    {
      "date": "<YYYY-MM-DD>",
      "description": "<string>",
      "amount": <number>,
      "type": "<exactly EXPENSE or INCOME>",
      "category": "<guess best category, e.g. Transport, Food, Salary>"
    }
  ]
}`;

            try {
                const ai = getGeminiClient();
                const response = await ai.models.generateContent({
                    model: "gemini-2.5-flash",
                    contents: [
                        prompt,
                        {
                            inlineData: {
                                data: input.imageBase64,
                                mimeType: input.mimeType,
                            },
                        },
                    ],
                    config: {
                        temperature: 0,
                        responseMimeType: "application/json",
                    },
                });

                const text = response.text || "{}";
                try {
                    return JSON.parse(text);
                } catch {
                    const jsonMatch = text.match(/\{[\s\S]*\}/);
                    if (jsonMatch) return JSON.parse(jsonMatch[0]);
                    throw new Error("Could not parse document data");
                }
            } catch (error: any) {
                console.error("Gemini Scan Error:", error);
                throw new Error("Failed to process the document.");
            }
        }),

    suggestCategory: protectedProcedure
        .input(z.object({ merchant: z.string(), note: z.string().optional() }))
        .mutation(async ({ input }) => {
            const prompt = `Based on the merchant "${input.merchant}" and note "${input.note || ''}", suggest a category.
Valid categories are: Food & Dining, Transport, Shopping, Entertainment, Health, Bills & Utilities, Travel, Groceries, Education, Other.
Return ONLY a raw JSON object: {"category": "<valid_category_name>"}
Do not return any extra text.`;

            const ai = getGeminiClient();
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                config: {
                    temperature: 0,
                    responseMimeType: "application/json",
                },
            });

            const text = response.text || "{}";
            try {
                const parsed = JSON.parse(text);
                return { category: parsed.category || "Other" };
            } catch {
                return { category: "Other" };
            }
        }),

    suggestIcon: protectedProcedure
        .input(z.object({ name: z.string() }))
        .mutation(async ({ input }) => {
            const prompt = `Based on the name "${input.name}", suggest a visual icon representing it.
Choose ONE from this exact list of Lucide React icon names:
utensils, car, shopping-bag, film, heart-pulse, zap, plane, shopping-cart, book-open, coffee, home, monitor, smartphone, wifi, droplet, flame, bus, train, shirt, gift, game-pad, music, scissors, brief-case
Return ONLY a raw JSON object: {"icon": "<icon_name>"}
Do not return any extra text.`;

            const ai = getGeminiClient();
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                config: {
                    temperature: 0,
                    responseMimeType: "application/json",
                },
            });

            const text = response.text || "{}";
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
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        const [expensesSnap, budgetsSnap, categoriesSnap] = await Promise.all([
            ctx.db.collection("expenses").where("userId", "==", userId).where("date", ">=", startOfMonth).get(),
            ctx.db.collection("budgets").where("userId", "==", userId).get(),
            ctx.db.collection("categories").where("userId", "==", userId).get()
        ]);

        const categories = categoriesSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));
        const expenses = expensesSnap.docs.map(d => {
            const data = d.data() as any;
            return {
                ...data,
                category: data.categoryId ? categories.find(c => c.id === data.categoryId) : null
            };
        });
        const budgets = budgetsSnap.docs.map(d => d.data() as any);

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

        const totalSpent = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
        const totalBudget = budgets.reduce((sum, b) => sum + (b.amount || 0), 0);

        const categoryMap = new Map<string, number>();
        expenses.forEach((e) => {
            const cat = e.category?.name ?? "Other";
            categoryMap.set(cat, (categoryMap.get(cat) ?? 0) + (e.amount || 0));
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
            const ai = getGeminiClient();
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                config: {
                    temperature: 0,
                    responseMimeType: "application/json",
                },
            });
            const text = response.text || "{}";

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
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

            // Fetch contextual data from Firestore
            const [expensesSnap, incomesSnap, budgetsSnap, categoriesSnap] = await Promise.all([
                ctx.db.collection("expenses").where("userId", "==", userId).where("date", ">=", startOfMonth).orderBy("date", "desc").get(),
                ctx.db.collection("incomes").where("userId", "==", userId).where("date", ">=", startOfMonth).orderBy("date", "desc").get(),
                ctx.db.collection("budgets").where("userId", "==", userId).get(),
                ctx.db.collection("categories").where("userId", "==", userId).get()
            ]);

            const categories = categoriesSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));

            const expenses = expensesSnap.docs.map(d => {
                const data = d.data() as any;
                return {
                    ...data,
                    category: data.categoryId ? categories.find(c => c.id === data.categoryId) : null
                };
            });

            const incomes = incomesSnap.docs.map(d => d.data() as any);

            const budgets = budgetsSnap.docs.map(d => {
                const data = d.data() as any;
                return {
                    ...data,
                    category: data.categoryId ? categories.find(c => c.id === data.categoryId) : null
                };
            });

            const totalSpent = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
            const totalIncome = incomes.reduce((sum, i) => sum + (i.amount || 0), 0);
            const totalBudget = budgets.reduce((sum, b) => sum + (b.amount || 0), 0);

            let contextData = `User's Current Month Financials (Since ${new Date(startOfMonth).toLocaleDateString()}):
Total Income: ₹${totalIncome.toFixed(2)}
Total Spent: ₹${totalSpent.toFixed(2)}
Total Budget Configured: ₹${totalBudget.toFixed(2)}

Recent Expenses:
${expenses.slice(0, 10).map(e => `- ₹${e.amount} at ${e.merchant} (${e.category?.name || 'Uncategorized'}) on ${new Date(e.date).toLocaleDateString()}`).join('\n')}

Recent Incomes:
${incomes.slice(0, 5).map(i => `- ₹${i.amount} from ${i.source} on ${new Date(i.date).toLocaleDateString()}`).join('\n')}

Active Budgets:
${budgets.map(b => `- ${b.category?.name || 'Overall'}: ₹${b.amount}`).join('\n')}
`;

            const systemInstruction = `You are Agent Floww, a helpful, intelligent, and concise AI financial assistant built into the Floww app. 
You help the user manage their cash, track their spending, and answer questions about their habits.
Use the provided financial context to give precise, personalized answers.
Be conversational but direct. Do not use markdown headers unless necessary, keep formatting simple.
If the user asks about something outside their financial data or app usage, nicely pivot back to their finances.

Context Information:
${contextData}`;

            const formattedMessages = input.messages.map(m => ({
                role: m.role === "assistant" ? "model" : "user",
                parts: [{ text: m.content }]
            }));

            try {
                const ai = getGeminiClient();
                const response = await ai.models.generateContent({
                    model: "gemini-2.5-flash",
                    contents: formattedMessages,
                    config: {
                        systemInstruction: { parts: [{ text: systemInstruction }] },
                        temperature: 0.7,
                        maxOutputTokens: 500,
                    }
                });

                return {
                    message: response.text || "I'm sorting through some numbers, could you repeat that?",
                };
            } catch (error: any) {
                console.error("Gemini Chat Error:", error);
                throw new Error("Floww AI is currently unavailable.");
            }
        }),
});
