import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { PaymentMethod } from "@prisma/client";

export const expenseRouter = router({
    list: protectedProcedure
        .input(
            z.object({
                categoryId: z.string().optional(),
                paymentMethod: z.nativeEnum(PaymentMethod).optional(),
                startDate: z.date().optional(),
                endDate: z.date().optional(),
                limit: z.number().min(1).max(100).default(50),
                cursor: z.string().optional(),
            }).optional()
        )
        .query(async ({ ctx, input }) => {
            const userId = ctx.session.user.id!;
            const expenses = await ctx.db.expense.findMany({
                where: {
                    userId,
                    ...(input?.categoryId && { categoryId: input.categoryId }),
                    ...(input?.paymentMethod && { paymentMethod: input.paymentMethod }),
                    ...(input?.startDate || input?.endDate
                        ? {
                            date: {
                                ...(input.startDate && { gte: input.startDate }),
                                ...(input.endDate && { lte: input.endDate }),
                            },
                        }
                        : {}),
                },
                include: { category: true },
                orderBy: { date: "desc" },
                take: input?.limit ?? 50,
                ...(input?.cursor && {
                    skip: 1,
                    cursor: { id: input.cursor },
                }),
            });
            return expenses;
        }),

    getMonthTotal: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id!;
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const result = await ctx.db.expense.aggregate({
            where: { userId, date: { gte: startOfMonth } },
            _sum: { amount: true },
        });
        return result._sum.amount ?? 0;
    }),

    getRecentExpenses: protectedProcedure
        .input(z.object({ limit: z.number().default(5) }))
        .query(async ({ ctx, input }) => {
            const userId = ctx.session.user.id!;
            return ctx.db.expense.findMany({
                where: { userId },
                include: { category: true },
                orderBy: { date: "desc" },
                take: input.limit,
            });
        }),

    getMonthlyChartData: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id!;
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const expenses = await ctx.db.expense.findMany({
            where: { userId, date: { gte: startOfMonth } },
            select: { amount: true, date: true },
            orderBy: { date: "asc" },
        });

        const dailyTotals = Array.from({ length: now.getDate() }, (_, i) => ({
            day: i + 1,
            amount: 0,
        }));

        expenses.forEach((e) => {
            const day = e.date.getDate();
            if (day <= now.getDate()) {
                dailyTotals[day - 1].amount += e.amount;
            }
        });

        return dailyTotals;
    }),

    getCategoryChartData: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id!;
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const expenses = await ctx.db.expense.groupBy({
            by: ['categoryId'],
            where: {
                userId,
                date: { gte: startOfMonth },
                categoryId: { not: null }, // Only categorize those with a category
            },
            _sum: { amount: true },
        });

        // We need to fetch the category details (name, color) since groupBy only returns the ID
        const categoryIds = expenses.map(e => e.categoryId).filter(Boolean) as string[];

        const categories = await ctx.db.category.findMany({
            where: { id: { in: categoryIds } },
            select: { id: true, name: true, color: true },
        });

        // Map the results back together
        const result = expenses.map(e => {
            const cat = categories.find(c => c.id === e.categoryId);
            return {
                categoryId: e.categoryId,
                name: cat?.name ?? "Other",
                color: cat?.color ?? "#8E8E93",
                amount: e._sum.amount ?? 0,
            };
        }).sort((a, b) => b.amount - a.amount); // Largest slice first

        return result;
    }),

    create: protectedProcedure
        .input(
            z.object({
                amount: z.number().positive(),
                merchant: z.string().min(1),
                note: z.string().optional(),
                date: z.date().default(() => new Date()),
                paymentMethod: z.nativeEnum(PaymentMethod).default("CASH"),
                categoryId: z.string().optional(),
                receiptUrl: z.string().optional(),
                icon: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            console.log("Creating expense for user:", ctx.session.user.id, input);
            return ctx.db.expense.create({
                data: {
                    ...input,
                    userId: ctx.session.user.id!,
                },
                include: { category: true },
            });
        }),

    update: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                amount: z.number().positive().optional(),
                merchant: z.string().min(1).optional(),
                note: z.string().optional(),
                date: z.date().optional(),
                paymentMethod: z.nativeEnum(PaymentMethod).optional(),
                categoryId: z.string().optional(),
                receiptUrl: z.string().optional(),
                icon: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { id, ...data } = input;
            return ctx.db.expense.update({
                where: { id, userId: ctx.session.user.id! },
                data,
                include: { category: true },
            });
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            return ctx.db.expense.delete({
                where: { id: input.id, userId: ctx.session.user.id! },
            });
        }),

    getDailyExpenses: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id!;
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

        const expenses = await ctx.db.expense.findMany({
            where: { userId, date: { gte: startOfMonth } },
            select: { amount: true, date: true },
        });

        // Build a map: day number → total amount
        const dayMap: Record<number, number> = {};
        expenses.forEach((e) => {
            const day = e.date.getDate();
            dayMap[day] = (dayMap[day] ?? 0) + e.amount;
        });

        // Fill all days up to today with 0 for missing days
        const today = now.getDate();
        return Array.from({ length: today }, (_, i) => ({
            day: i + 1,
            label: `${i + 1}`,
            amount: dayMap[i + 1] ?? 0,
        }));
    }),

    getYearlyIncomeExpenseChart: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id!;
        const now = new Date();
        const currentYear = now.getFullYear();
        const startOfYear = new Date(currentYear, 0, 1);

        const expenses = await ctx.db.expense.findMany({
            where: { userId, date: { gte: startOfYear } },
            select: { amount: true, date: true },
        });

        // Use any to bypass Prisma type error in client temporarily
        const incomes = await (ctx.db as any).income.findMany({
            where: { userId, date: { gte: startOfYear } },
            select: { amount: true, date: true },
        });

        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthlyData = Array.from({ length: 12 }, (_, i) => ({
            month: months[i]!,
            income: 0,
            expense: 0,
            sortOrder: i,
        }));

        expenses.forEach((e) => {
            const monthIndex = e.date.getMonth();
            monthlyData[monthIndex]!.expense += e.amount;
        });

        incomes.forEach((i: any) => {
            const monthIndex = i.date.getMonth();
            monthlyData[monthIndex]!.income += i.amount;
        });

        return monthlyData;
    }),
});
