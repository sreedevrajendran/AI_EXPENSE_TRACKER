import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

export const incomeRouter = router({
    list: protectedProcedure
        .input(
            z.object({
                startDate: z.date().optional(),
                endDate: z.date().optional(),
                limit: z.number().min(1).max(100).default(50),
                cursor: z.string().optional(),
            }).optional()
        )
        .query(async ({ ctx, input }) => {
            const userId = ctx.session.user.id!;
            const incomes = await ctx.db.income.findMany({
                where: {
                    userId,
                    ...(input?.startDate || input?.endDate
                        ? {
                            date: {
                                ...(input.startDate && { gte: input.startDate }),
                                ...(input.endDate && { lte: input.endDate }),
                            },
                        }
                        : {}),
                },
                orderBy: { date: "desc" },
                take: input?.limit ?? 50,
                include: { category: true },
                ...(input?.cursor && {
                    skip: 1,
                    cursor: { id: input.cursor },
                }),
            });
            return incomes;
        }),

    getMonthTotal: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id!;
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const result = await ctx.db.income.aggregate({
            where: { userId, date: { gte: startOfMonth } },
            _sum: { amount: true },
        });
        return result._sum.amount ?? 0;
    }),

    getRecentIncomes: protectedProcedure
        .input(z.object({ limit: z.number().default(5) }))
        .query(async ({ ctx, input }) => {
            const userId = ctx.session.user.id!;
            return ctx.db.income.findMany({
                where: { userId },
                include: { category: true },
                orderBy: { date: "desc" },
                take: input.limit,
            });
        }),

    create: protectedProcedure
        .input(
            z.object({
                amount: z.number().positive(),
                source: z.string().min(1),
                note: z.string().optional(),
                date: z.date().default(() => new Date()),
                categoryId: z.string().optional(),
                receiptUrl: z.string().optional(),
                icon: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            return ctx.db.income.create({
                data: {
                    ...input,
                    userId: ctx.session.user.id!,
                },
            });
        }),

    bulkCreate: protectedProcedure
        .input(
            z.array(
                z.object({
                    amount: z.number().positive(),
                    source: z.string().min(1),
                    note: z.string().optional(),
                    date: z.date().default(() => new Date()),
                    categoryId: z.string().optional(),
                    receiptUrl: z.string().optional(),
                    icon: z.string().optional(),
                })
            )
        )
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id!;
            const data = input.map(item => ({
                ...item,
                userId,
            }));
            return ctx.db.income.createMany({
                data,
            });
        }),

    update: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                amount: z.number().positive().optional(),
                source: z.string().min(1).optional(),
                note: z.string().optional(),
                date: z.date().optional(),
                categoryId: z.string().optional(),
                receiptUrl: z.string().optional(),
                icon: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { id, ...data } = input;
            return ctx.db.income.update({
                where: { id, userId: ctx.session.user.id! },
                data,
            });
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            return ctx.db.income.delete({
                where: { id: input.id, userId: ctx.session.user.id! },
            });
        }),
});
