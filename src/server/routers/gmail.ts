import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { google } from "googleapis";
import { TRPCError } from "@trpc/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const gmailRouter = router({
    getStatus: protectedProcedure.query(async ({ ctx }) => {
        const user = await ctx.db.user.findUnique({
            where: { id: ctx.session.user.id },
            select: { gmailRefreshToken: true }
        });
        return { isConnected: !!user?.gmailRefreshToken };
    }),

    syncCurrentMonth: protectedProcedure.mutation(async ({ ctx }) => {
        const userId = ctx.session.user.id!;

        // 1. Fetch User's Specific Gmail Refresh Token
        const user = await ctx.db.user.findUnique({
            where: { id: userId },
            select: { gmailRefreshToken: true }
        });

        if (!user || !user.gmailRefreshToken) {
            throw new TRPCError({ code: "UNAUTHORIZED", message: "Gmail not connected. Please go to Settings to connect your Gmail account for AI Sync." });
        }

        // 2. Setup OAuth2 Client
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET
        );

        oauth2Client.setCredentials({
            refresh_token: user.gmailRefreshToken,
        });

        const gmail = google.gmail({ version: "v1", auth: oauth2Client });

        // 3. Construct Query for Current Month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const afterDate = startOfMonth.toISOString().split("T")[0].replace(/-/g, "/"); // YYYY/MM/DD

        const query = `after:${afterDate} (receipt OR invoice OR paid OR order OR received OR payment)`;

        let messages: any[] = [];
        try {
            const res = await gmail.users.messages.list({
                userId: "me",
                q: query,
                maxResults: 20, // Limit to recent 20 to avoid rate limits
            });
            messages = res.data.messages || [];
        } catch (error: any) {
            const status = error?.response?.status || error?.code;
            const errorMsg = error?.response?.data?.error?.message || error?.message || "Unknown error";
            console.error("Gmail API Error:", status, errorMsg);

            if (status === 403 || status === "403") {
                throw new TRPCError({ code: "FORBIDDEN", message: `Gmail access denied: ${errorMsg}. Make sure the Gmail API is enabled in your Google Cloud Console.` });
            }
            if (status === 401 || status === "401") {
                throw new TRPCError({ code: "UNAUTHORIZED", message: "Gmail token expired. Please sign out and sign back in to refresh your access." });
            }
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Failed to fetch emails: ${errorMsg}` });
        }

        if (messages.length === 0) {
            return { added: 0, message: "No new receipt emails found this month." };
        }

        // 4. Fetch Email Contents
        const emailContents: string[] = [];
        for (const msg of messages) {
            if (!msg.id) continue;
            try {
                const fullMsg = await gmail.users.messages.get({
                    userId: "me",
                    id: msg.id,
                    format: "full",
                });
                const snippet = fullMsg.data.snippet;
                if (snippet && snippet.trim().length > 10) {
                    emailContents.push(`Email Snippet: ${snippet}`);
                }
            } catch (err) {
                console.error("Failed to fetch specific message", msg.id);
            }
        }

        if (emailContents.length === 0) {
            return { added: 0, message: "No readable receipt emails found." };
        }

        // 5. Parse with Gemini
        const prompt = `You are a personal finance assistant. I will provide you with snippets of recent emails. 
Extract any obvious expenses or incomes from these snippets. Ignore anything that looks like spam, newsletters, or unclear transactions.
For each valid transaction, determine:
- type: "expense" or "income"
- amount: (number)
- merchant: (string, the store or sender)
- category: (string, guess the category like Food, Travel, Shopping, Utilities, etc.)
- date: (try to infer if included, otherwise use null)

Return a single JSON array of valid objects. Do NOT include markdown blocks. Example:
[
  { "type": "expense", "amount": 15.40, "merchant": "Uber", "category": "Transport" }
]

Here are the emails:\n${emailContents.join("\n---\n")}`;

        let parsedData: any[] = [];
        try {
            const chatCompletion = await groq.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                model: "llama-3.1-8b-instant",
                temperature: 0,
            });
            const text = chatCompletion.choices[0]?.message?.content || "[]";

            try {
                parsedData = JSON.parse(text);
            } catch {
                const jsonMatch = text.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                    parsedData = JSON.parse(jsonMatch[0]);
                } else {
                    throw new Error(`Gemini returned invalid JSON format. Response was: ${text.substring(0, 50)}...`);
                }
            }
        } catch (error: any) {
            console.error("Gemini Parsing Error", error);
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Failed to analyze emails: ${error.message || "Unknown Gemini error"}` });
        }

        if (!Array.isArray(parsedData) || parsedData.length === 0) {
            return { added: 0, message: "AI found no clear transactions in the fetched emails." };
        }

        // 6. Save to Database with Duplicate Prevention
        let addedCount = 0;

        // Pre-fetch user's categories for mapping
        const userCategories = await ctx.db.category.findMany({ where: { userId } });

        for (const item of parsedData) {
            if (!item.amount || !item.merchant || !item.type) continue;

            // Duplicate Check
            if (item.type === "expense") {
                const exists = await ctx.db.expense.findFirst({
                    where: {
                        userId,
                        amount: item.amount,
                        merchant: { contains: item.merchant, mode: "insensitive" },
                        date: { gte: startOfMonth }
                    }
                });
                if (exists) continue;
            } else {
                const exists = await ctx.db.income.findFirst({
                    where: {
                        userId,
                        amount: item.amount,
                        source: { contains: item.merchant, mode: "insensitive" },
                        date: { gte: startOfMonth }
                    }
                });
                if (exists) continue;
            }

            // Category Matching
            let categoryId = undefined;
            if (item.category) {
                const matchedCat = userCategories.find(c => c.name.toLowerCase().includes(item.category.toLowerCase()));
                if (matchedCat) {
                    categoryId = matchedCat.id;
                } else {
                    // Auto-create category if AI guessed a solid one
                    try {
                        const newCat = await ctx.db.category.create({
                            data: { userId, name: item.category, icon: "circle", color: "#8E8E93" }
                        });
                        categoryId = newCat.id;
                        userCategories.push(newCat);
                    } catch { /* ignore */ }
                }
            }

            // Insert Database Record
            if (item.type === "expense") {
                await ctx.db.expense.create({
                    data: {
                        userId,
                        amount: item.amount,
                        merchant: item.merchant,
                        categoryId,
                        date: new Date(), // using today's date if not extracted exactly
                    }
                });
                addedCount++;
            } else if (item.type === "income") {
                await ctx.db.income.create({
                    data: {
                        userId,
                        amount: item.amount,
                        source: item.merchant,
                        categoryId,
                        date: new Date(),
                    }
                });
                addedCount++;
            }
        }

        return { added: addedCount, message: `Successfully synced ${addedCount} transactions from Gmail.` };
    }),

    disconnect: protectedProcedure.mutation(async ({ ctx }) => {
        await ctx.db.user.update({
            where: { id: ctx.session.user.id },
            data: { gmailRefreshToken: null }
        });
        return { success: true };
    }),
});
