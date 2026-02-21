import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { BudgetPeriod } from "@prisma/client";

export const budgetRouter = router({
    list: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id!;
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const budgets = await ctx.db.budget.findMany({
            where: { userId },
            include: { category: true },
        });

        // Calculate spent amount for each budget's category
        const budgetsWithSpent = await Promise.all(
            budgets.map(async (budget) => {
                const spent = await ctx.db.expense.aggregate({
                    where: {
                        userId,
                        ...(budget.categoryId && { categoryId: budget.categoryId }),
                        date: { gte: startOfMonth },
                    },
                    _sum: { amount: true },
                });
                return { ...budget, spent: spent._sum.amount ?? 0 };
            })
        );

        return budgetsWithSpent;
    }),

    getTotalBudget: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id!;
        const result = await ctx.db.budget.aggregate({
            where: { userId },
            _sum: { amount: true },
        });
        return result._sum.amount ?? 0;
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
            return ctx.db.budget.create({
                data: { ...input, userId: ctx.session.user.id! },
                include: { category: true },
            });
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
            return ctx.db.budget.update({
                where: { id, userId: ctx.session.user.id! },
                data,
                include: { category: true },
            });
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            return ctx.db.budget.delete({
                where: { id: input.id, userId: ctx.session.user.id! },
            });
        }),
});
