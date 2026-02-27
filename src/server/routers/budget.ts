import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

// Ensure BudgetPeriod enum matches since we ripped out Prisma
const BudgetPeriod = {
    MONTHLY: "MONTHLY",
    WEEKLY: "WEEKLY",
    YEARLY: "YEARLY"
} as const;

export const budgetRouter = router({
    list: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id!;
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Fetch user's budgets
        const budgetsSnapshot = await ctx.db.collection("budgets")
            .where("userId", "==", userId)
            .get();
        const budgets = budgetsSnapshot.docs.map(d => ({ id: d.id, ...d.data() })) as any[];

        // Fetch user's categories to populate the relations
        const categoriesSnapshot = await ctx.db.collection("categories")
            .where("userId", "==", userId)
            .get();
        const categories = categoriesSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

        // Fetch all expenses for the current month
        const expensesSnapshot = await ctx.db.collection("expenses")
            .where("userId", "==", userId)
            .where("date", ">=", startOfMonth.toISOString())
            .get();
        const expenses = expensesSnapshot.docs.map(d => ({ id: d.id, ...d.data() })) as any[];

        // Calculate spent amount for each budget's category in memory
        const budgetsWithSpent = budgets.map((budget) => {
            const budgetExpenses = expenses.filter(e => budget.categoryId ? e.categoryId === budget.categoryId : true);
            const spent = budgetExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

            return {
                ...budget,
                spent,
                category: budget.categoryId ? categories.find(c => c.id === budget.categoryId) : null
            };
        });

        return budgetsWithSpent;
    }),

    getTotalBudget: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id!;
        const snapshot = await ctx.db.collection("budgets").where("userId", "==", userId).get();
        const total = snapshot.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0);
        return total;
    }),

    create: protectedProcedure
        .input(
            z.object({
                amount: z.number().positive(),
                period: z.nativeEnum(BudgetPeriod).default("MONTHLY"),
                categoryId: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const newDoc = {
                ...input,
                userId: ctx.session.user.id!,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            const added = await ctx.db.collection("budgets").add(newDoc);

            let category = null;
            if (input.categoryId) {
                const catDoc = await ctx.db.collection("categories").doc(input.categoryId).get();
                if (catDoc.exists) {
                    category = { id: catDoc.id, ...catDoc.data() };
                }
            }

            return { id: added.id, ...newDoc, category };
        }),

    update: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                amount: z.number().positive().optional(),
                period: z.nativeEnum(BudgetPeriod).optional(),
                categoryId: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { id, ...data } = input;
            const docRef = ctx.db.collection("budgets").doc(id);
            const doc = await docRef.get();
            if (!doc.exists || doc.data()?.userId !== ctx.session.user.id!) {
                throw new Error("Not authorized");
            }

            await docRef.update({ ...data, updatedAt: new Date().toISOString() });

            let category = null;
            const updatedCategoryId = data.categoryId ?? doc.data()?.categoryId;
            if (updatedCategoryId) {
                const catDoc = await ctx.db.collection("categories").doc(updatedCategoryId).get();
                if (catDoc.exists) {
                    category = { id: catDoc.id, ...catDoc.data() };
                }
            }

            return { id, ...doc.data(), ...data, category };
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const docRef = ctx.db.collection("budgets").doc(input.id);
            const doc = await docRef.get();
            if (!doc.exists || doc.data()?.userId !== ctx.session.user.id!) {
                throw new Error("Not authorized");
            }
            await docRef.delete();
            return { success: true };
        }),
});
