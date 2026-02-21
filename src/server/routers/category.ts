import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

export const categoryRouter = router({
    list: protectedProcedure.query(async ({ ctx }) => {
        return ctx.db.category.findMany({
            where: { userId: ctx.session.user.id!, parentId: null },
            include: { children: true },
            orderBy: { name: "asc" },
        });
    }),

    listAll: protectedProcedure.query(async ({ ctx }) => {
        return ctx.db.category.findMany({
            where: { userId: ctx.session.user.id! },
            include: { children: true, parent: true },
            orderBy: { name: "asc" },
        });
    }),

    create: protectedProcedure
        .input(
            z.object({
                name: z.string().min(1),
                icon: z.string().default("circle"),
                color: z.string().default("#007AFF"),
                parentId: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id!;

            // Check if category already exists (case-insensitive)
            const existing = await ctx.db.category.findFirst({
                where: {
                    userId,
                    name: {
                        equals: input.name,
                        mode: "insensitive",
                    }
                }
            });

            if (existing) {
                return existing;
            }

            return ctx.db.category.create({
                data: { ...input, userId },
            });
        }),

    update: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                name: z.string().optional(),
                icon: z.string().optional(),
                color: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { id, ...data } = input;
            return ctx.db.category.update({
                where: { id, userId: ctx.session.user.id! },
                data,
            });
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            return ctx.db.category.delete({
                where: { id: input.id, userId: ctx.session.user.id! },
            });
        }),

    seedDefaults: protectedProcedure.mutation(async ({ ctx }) => {
        const userId = ctx.session.user.id!;
        const defaults = [
            { name: "Food & Dining", icon: "utensils", color: "#FF9F0A" },
            { name: "Transport", icon: "car", color: "#007AFF" },
            { name: "Shopping", icon: "shopping-bag", color: "#FF2D55" },
            { name: "Entertainment", icon: "film", color: "#5856D6" },
            { name: "Health", icon: "heart-pulse", color: "#34C759" },
            { name: "Bills & Utilities", icon: "zap", color: "#FF6B00" },
            { name: "Travel", icon: "plane", color: "#5AC8FA" },
            { name: "Groceries", icon: "shopping-cart", color: "#30D158" },
            { name: "Education", icon: "book-open", color: "#BF5AF2" },
            { name: "Other", icon: "circle", color: "#8E8E93" },
        ];

        let seededCount = 0;
        for (const d of defaults) {
            const exists = await ctx.db.category.findFirst({
                where: { userId, name: d.name },
            });
            if (!exists) {
                await ctx.db.category.create({
                    data: { ...d, userId },
                });
                seededCount++;
            }
        }

        return { seeded: seededCount > 0, count: seededCount };
    }),
});
