module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/util [external] (util, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("util", () => require("util"));

module.exports = mod;
}),
"[externals]/url [external] (url, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("url", () => require("url"));

module.exports = mod;
}),
"[externals]/http [external] (http, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("http", () => require("http"));

module.exports = mod;
}),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[externals]/assert [external] (assert, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("assert", () => require("assert"));

module.exports = mod;
}),
"[externals]/querystring [external] (querystring, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("querystring", () => require("querystring"));

module.exports = mod;
}),
"[externals]/buffer [external] (buffer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("buffer", () => require("buffer"));

module.exports = mod;
}),
"[externals]/zlib [external] (zlib, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("zlib", () => require("zlib"));

module.exports = mod;
}),
"[externals]/https [external] (https, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("https", () => require("https"));

module.exports = mod;
}),
"[externals]/events [external] (events, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("events", () => require("events"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/src/lib/db.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "db",
    ()=>db
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$29$__ = __turbopack_context__.i("[externals]/@prisma/client [external] (@prisma/client, cjs, [project]/node_modules/@prisma/client)");
;
const globalForPrisma = globalThis;
const db = globalForPrisma.prisma ?? new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$29$__["PrismaClient"]({
    log: ("TURBOPACK compile-time truthy", 1) ? [
        "query",
        "error",
        "warn"
    ] : "TURBOPACK unreachable"
});
if ("TURBOPACK compile-time truthy", 1) globalForPrisma.prisma = db;
}),
"[project]/src/auth.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "authOptions",
    ()=>authOptions,
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next-auth/index.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$next$2d$auth$2f$prisma$2d$adapter$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@next-auth/prisma-adapter/dist/index.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$providers$2f$google$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next-auth/providers/google.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/db.ts [app-route] (ecmascript)");
;
;
;
;
const authOptions = {
    adapter: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$next$2d$auth$2f$prisma$2d$adapter$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["PrismaAdapter"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"]),
    providers: [
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$providers$2f$google$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"])({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true
        })
    ],
    session: {
        strategy: "database"
    },
    callbacks: {
        session ({ session, user }) {
            if (session.user) {
                session.user.id = user.id;
            }
            return session;
        }
    },
    pages: {
        signIn: "/login"
    }
};
const __TURBOPACK__default__export__ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"])(authOptions);
}),
"[project]/src/server/trpc.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createTRPCContext",
    ()=>createTRPCContext,
    "protectedProcedure",
    ()=>protectedProcedure,
    "publicProcedure",
    ()=>publicProcedure,
    "router",
    ()=>router
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$trpc$2f$server$2f$dist$2f$initTRPC$2d$RoZMIBeA$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@trpc/server/dist/initTRPC-RoZMIBeA.mjs [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$trpc$2f$server$2f$dist$2f$tracked$2d$Bjtgv3wJ$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@trpc/server/dist/tracked-Bjtgv3wJ.mjs [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$superjson$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/superjson/dist/index.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next-auth/index.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/auth.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/db.ts [app-route] (ecmascript)");
;
;
;
;
;
const createTRPCContext = async ()=>{
    const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getServerSession"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["authOptions"]);
    return {
        session,
        db: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"]
    };
};
const t = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$trpc$2f$server$2f$dist$2f$initTRPC$2d$RoZMIBeA$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["initTRPC"].context().create({
    transformer: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$superjson$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"]
});
const router = t.router;
const publicProcedure = t.procedure;
const enforceUserIsAuthed = t.middleware(({ ctx, next })=>{
    if (!ctx.session?.user?.id) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$trpc$2f$server$2f$dist$2f$tracked$2d$Bjtgv3wJ$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TRPCError"]({
            code: "UNAUTHORIZED"
        });
    }
    return next({
        ctx: {
            ...ctx,
            session: {
                ...ctx.session,
                user: ctx.session.user
            }
        }
    });
});
const protectedProcedure = t.procedure.use(enforceUserIsAuthed);
}),
"[project]/src/server/routers/expense.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "expenseRouter",
    ()=>expenseRouter
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/external.js [app-route] (ecmascript) <export * as z>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$trpc$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/server/trpc.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$29$__ = __turbopack_context__.i("[externals]/@prisma/client [external] (@prisma/client, cjs, [project]/node_modules/@prisma/client)");
;
;
;
const expenseRouter = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$trpc$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["router"])({
    list: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$trpc$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["protectedProcedure"].input(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        categoryId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
        paymentMethod: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].nativeEnum(__TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$29$__["PaymentMethod"]).optional(),
        startDate: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].date().optional(),
        endDate: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].date().optional(),
        limit: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().min(1).max(100).default(50),
        cursor: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional()
    }).optional()).query(async ({ ctx, input })=>{
        const userId = ctx.session.user.id;
        const expenses = await ctx.db.expense.findMany({
            where: {
                userId,
                ...input?.categoryId && {
                    categoryId: input.categoryId
                },
                ...input?.paymentMethod && {
                    paymentMethod: input.paymentMethod
                },
                ...input?.startDate || input?.endDate ? {
                    date: {
                        ...input.startDate && {
                            gte: input.startDate
                        },
                        ...input.endDate && {
                            lte: input.endDate
                        }
                    }
                } : {}
            },
            include: {
                category: true
            },
            orderBy: {
                date: "desc"
            },
            take: input?.limit ?? 50,
            ...input?.cursor && {
                skip: 1,
                cursor: {
                    id: input.cursor
                }
            }
        });
        return expenses;
    }),
    getMonthTotal: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$trpc$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["protectedProcedure"].query(async ({ ctx })=>{
        const userId = ctx.session.user.id;
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const result = await ctx.db.expense.aggregate({
            where: {
                userId,
                date: {
                    gte: startOfMonth
                }
            },
            _sum: {
                amount: true
            }
        });
        return result._sum.amount ?? 0;
    }),
    getRecentExpenses: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$trpc$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["protectedProcedure"].input(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        limit: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().default(5)
    })).query(async ({ ctx, input })=>{
        const userId = ctx.session.user.id;
        return ctx.db.expense.findMany({
            where: {
                userId
            },
            include: {
                category: true
            },
            orderBy: {
                date: "desc"
            },
            take: input.limit
        });
    }),
    getMonthlyChartData: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$trpc$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["protectedProcedure"].query(async ({ ctx })=>{
        const userId = ctx.session.user.id;
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const expenses = await ctx.db.expense.findMany({
            where: {
                userId,
                date: {
                    gte: startOfMonth
                }
            },
            select: {
                amount: true,
                date: true
            },
            orderBy: {
                date: "asc"
            }
        });
        const dailyTotals = Array.from({
            length: now.getDate()
        }, (_, i)=>({
                day: i + 1,
                amount: 0
            }));
        expenses.forEach((e)=>{
            const day = e.date.getDate();
            if (day <= now.getDate()) {
                dailyTotals[day - 1].amount += e.amount;
            }
        });
        return dailyTotals;
    }),
    getCategoryChartData: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$trpc$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["protectedProcedure"].query(async ({ ctx })=>{
        const userId = ctx.session.user.id;
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const expenses = await ctx.db.expense.groupBy({
            by: [
                'categoryId'
            ],
            where: {
                userId,
                date: {
                    gte: startOfMonth
                },
                categoryId: {
                    not: null
                }
            },
            _sum: {
                amount: true
            }
        });
        // We need to fetch the category details (name, color) since groupBy only returns the ID
        const categoryIds = expenses.map((e)=>e.categoryId).filter(Boolean);
        const categories = await ctx.db.category.findMany({
            where: {
                id: {
                    in: categoryIds
                }
            },
            select: {
                id: true,
                name: true,
                color: true
            }
        });
        // Map the results back together
        const result = expenses.map((e)=>{
            const cat = categories.find((c)=>c.id === e.categoryId);
            return {
                categoryId: e.categoryId,
                name: cat?.name ?? "Other",
                color: cat?.color ?? "#8E8E93",
                amount: e._sum.amount ?? 0
            };
        }).sort((a, b)=>b.amount - a.amount); // Largest slice first
        return result;
    }),
    create: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$trpc$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["protectedProcedure"].input(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        amount: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().positive(),
        merchant: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1),
        note: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
        date: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].date().default(()=>new Date()),
        paymentMethod: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].nativeEnum(__TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$29$__["PaymentMethod"]).default("CASH"),
        categoryId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
        receiptUrl: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional()
    })).mutation(async ({ ctx, input })=>{
        console.log("Creating expense for user:", ctx.session.user.id, input);
        return ctx.db.expense.create({
            data: {
                ...input,
                userId: ctx.session.user.id
            },
            include: {
                category: true
            }
        });
    }),
    update: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$trpc$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["protectedProcedure"].input(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
        amount: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().positive().optional(),
        merchant: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1).optional(),
        note: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
        date: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].date().optional(),
        paymentMethod: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].nativeEnum(__TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$29$__["PaymentMethod"]).optional(),
        categoryId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
        receiptUrl: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional()
    })).mutation(async ({ ctx, input })=>{
        const { id, ...data } = input;
        return ctx.db.expense.update({
            where: {
                id,
                userId: ctx.session.user.id
            },
            data,
            include: {
                category: true
            }
        });
    }),
    delete: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$trpc$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["protectedProcedure"].input(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()
    })).mutation(async ({ ctx, input })=>{
        return ctx.db.expense.delete({
            where: {
                id: input.id,
                userId: ctx.session.user.id
            }
        });
    }),
    getYearlyIncomeExpenseChart: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$trpc$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["protectedProcedure"].query(async ({ ctx })=>{
        const userId = ctx.session.user.id;
        const now = new Date();
        const currentYear = now.getFullYear();
        const startOfYear = new Date(currentYear, 0, 1);
        const expenses = await ctx.db.expense.findMany({
            where: {
                userId,
                date: {
                    gte: startOfYear
                }
            },
            select: {
                amount: true,
                date: true
            }
        });
        // Use any to bypass Prisma type error in client temporarily
        const incomes = await ctx.db.income.findMany({
            where: {
                userId,
                date: {
                    gte: startOfYear
                }
            },
            select: {
                amount: true,
                date: true
            }
        });
        const months = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec"
        ];
        const monthlyData = Array.from({
            length: 12
        }, (_, i)=>({
                month: months[i],
                income: 0,
                expense: 0,
                sortOrder: i
            }));
        expenses.forEach((e)=>{
            const monthIndex = e.date.getMonth();
            monthlyData[monthIndex].expense += e.amount;
        });
        incomes.forEach((i)=>{
            const monthIndex = i.date.getMonth();
            monthlyData[monthIndex].income += i.amount;
        });
        return monthlyData;
    })
});
}),
"[project]/src/server/routers/category.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "categoryRouter",
    ()=>categoryRouter
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/external.js [app-route] (ecmascript) <export * as z>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$trpc$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/server/trpc.ts [app-route] (ecmascript)");
;
;
const categoryRouter = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$trpc$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["router"])({
    list: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$trpc$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["protectedProcedure"].query(async ({ ctx })=>{
        return ctx.db.category.findMany({
            where: {
                userId: ctx.session.user.id,
                parentId: null
            },
            include: {
                children: true
            },
            orderBy: {
                name: "asc"
            }
        });
    }),
    listAll: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$trpc$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["protectedProcedure"].query(async ({ ctx })=>{
        return ctx.db.category.findMany({
            where: {
                userId: ctx.session.user.id
            },
            include: {
                children: true,
                parent: true
            },
            orderBy: {
                name: "asc"
            }
        });
    }),
    create: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$trpc$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["protectedProcedure"].input(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        name: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1),
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().default("circle"),
        color: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().default("#007AFF"),
        parentId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional()
    })).mutation(async ({ ctx, input })=>{
        const userId = ctx.session.user.id;
        // Check if category already exists (case-insensitive)
        const existing = await ctx.db.category.findFirst({
            where: {
                userId,
                name: {
                    equals: input.name,
                    mode: "insensitive"
                }
            }
        });
        if (existing) {
            return existing;
        }
        return ctx.db.category.create({
            data: {
                ...input,
                userId
            }
        });
    }),
    update: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$trpc$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["protectedProcedure"].input(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
        name: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
        color: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional()
    })).mutation(async ({ ctx, input })=>{
        const { id, ...data } = input;
        return ctx.db.category.update({
            where: {
                id,
                userId: ctx.session.user.id
            },
            data
        });
    }),
    delete: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$trpc$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["protectedProcedure"].input(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()
    })).mutation(async ({ ctx, input })=>{
        return ctx.db.category.delete({
            where: {
                id: input.id,
                userId: ctx.session.user.id
            }
        });
    }),
    seedDefaults: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$trpc$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["protectedProcedure"].mutation(async ({ ctx })=>{
        const userId = ctx.session.user.id;
        const defaults = [
            {
                name: "Food & Dining",
                icon: "utensils",
                color: "#FF9F0A"
            },
            {
                name: "Transport",
                icon: "car",
                color: "#007AFF"
            },
            {
                name: "Shopping",
                icon: "shopping-bag",
                color: "#FF2D55"
            },
            {
                name: "Entertainment",
                icon: "film",
                color: "#5856D6"
            },
            {
                name: "Health",
                icon: "heart-pulse",
                color: "#34C759"
            },
            {
                name: "Bills & Utilities",
                icon: "zap",
                color: "#FF6B00"
            },
            {
                name: "Travel",
                icon: "plane",
                color: "#5AC8FA"
            },
            {
                name: "Groceries",
                icon: "shopping-cart",
                color: "#30D158"
            },
            {
                name: "Education",
                icon: "book-open",
                color: "#BF5AF2"
            },
            {
                name: "Other",
                icon: "circle",
                color: "#8E8E93"
            }
        ];
        let seededCount = 0;
        for (const d of defaults){
            const exists = await ctx.db.category.findFirst({
                where: {
                    userId,
                    name: d.name
                }
            });
            if (!exists) {
                await ctx.db.category.create({
                    data: {
                        ...d,
                        userId
                    }
                });
                seededCount++;
            }
        }
        return {
            seeded: seededCount > 0,
            count: seededCount
        };
    })
});
}),
"[project]/src/server/routers/budget.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "budgetRouter",
    ()=>budgetRouter
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/external.js [app-route] (ecmascript) <export * as z>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$trpc$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/server/trpc.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$29$__ = __turbopack_context__.i("[externals]/@prisma/client [external] (@prisma/client, cjs, [project]/node_modules/@prisma/client)");
;
;
;
const budgetRouter = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$trpc$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["router"])({
    list: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$trpc$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["protectedProcedure"].query(async ({ ctx })=>{
        const userId = ctx.session.user.id;
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const budgets = await ctx.db.budget.findMany({
            where: {
                userId
            },
            include: {
                category: true
            }
        });
        // Calculate spent amount for each budget's category
        const budgetsWithSpent = await Promise.all(budgets.map(async (budget)=>{
            const spent = await ctx.db.expense.aggregate({
                where: {
                    userId,
                    ...budget.categoryId && {
                        categoryId: budget.categoryId
                    },
                    date: {
                        gte: startOfMonth
                    }
                },
                _sum: {
                    amount: true
                }
            });
            return {
                ...budget,
                spent: spent._sum.amount ?? 0
            };
        }));
        return budgetsWithSpent;
    }),
    getTotalBudget: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$trpc$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["protectedProcedure"].query(async ({ ctx })=>{
        const userId = ctx.session.user.id;
        const result = await ctx.db.budget.aggregate({
            where: {
                userId
            },
            _sum: {
                amount: true
            }
        });
        return result._sum.amount ?? 0;
    }),
    create: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$trpc$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["protectedProcedure"].input(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        amount: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().positive(),
        period: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].nativeEnum(__TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$29$__["BudgetPeriod"]).default("MONTHLY"),
        categoryId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional()
    })).mutation(async ({ ctx, input })=>{
        return ctx.db.budget.create({
            data: {
                ...input,
                userId: ctx.session.user.id
            },
            include: {
                category: true
            }
        });
    }),
    update: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$trpc$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["protectedProcedure"].input(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
        amount: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().positive().optional(),
        period: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].nativeEnum(__TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$29$__["BudgetPeriod"]).optional(),
        categoryId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional()
    })).mutation(async ({ ctx, input })=>{
        const { id, ...data } = input;
        return ctx.db.budget.update({
            where: {
                id,
                userId: ctx.session.user.id
            },
            data,
            include: {
                category: true
            }
        });
    }),
    delete: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$trpc$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["protectedProcedure"].input(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()
    })).mutation(async ({ ctx, input })=>{
        return ctx.db.budget.delete({
            where: {
                id: input.id,
                userId: ctx.session.user.id
            }
        });
    })
});
}),
"[project]/src/server/routers/ai.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "aiRouter",
    ()=>aiRouter
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/external.js [app-route] (ecmascript) <export * as z>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$trpc$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/server/trpc.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$google$2f$generative$2d$ai$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@google/generative-ai/dist/index.mjs [app-route] (ecmascript)");
;
;
;
const genAI = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$google$2f$generative$2d$ai$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GoogleGenerativeAI"](process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash"
});
const aiRouter = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$trpc$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["router"])({
    scanReceipt: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$trpc$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["protectedProcedure"].input(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        imageBase64: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
        mimeType: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().default("image/jpeg")
    })).mutation(async ({ input })=>{
        const result = await model.generateContent([
            {
                inlineData: {
                    data: input.imageBase64,
                    mimeType: input.mimeType
                }
            },
            `You are an AI receipt scanner. Extract the following from this receipt image and return ONLY valid JSON (no markdown, no code blocks):
{
  "amount": <number, total amount>,
  "merchant": "<string, store/merchant name>",
  "date": "<string, ISO date YYYY-MM-DD>",
  "category": "<string, one of: Food & Dining, Transport, Shopping, Entertainment, Health, Bills & Utilities, Travel, Groceries, Education, Other>",
  "note": "<string, brief description>"
}
If you cannot determine a field, use null.`
        ]);
        const text = result.response.text();
        try {
            return JSON.parse(text);
        } catch  {
            // Try to extract JSON from response
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) return JSON.parse(jsonMatch[0]);
            return {
                amount: null,
                merchant: null,
                date: null,
                category: null,
                note: null
            };
        }
    }),
    mapIcon: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$trpc$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["protectedProcedure"].input(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        query: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()
    })).mutation(async ({ input })=>{
        const result = await model.generateContent(`Given the merchant or category name "${input.query}", return ONLY a single Lucide icon name (kebab-case) that best represents it.
Examples: "Starbucks" → "coffee", "Amazon" → "shopping-cart", "Netflix" → "film", "Uber" → "car", "McDonald's" → "utensils", "Gym" → "dumbbell"
Return ONLY the icon name, nothing else.`);
        return {
            icon: result.response.text().trim().toLowerCase().replace(/['"]/g, "")
        };
    }),
    getInsights: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$trpc$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["protectedProcedure"].query(async ({ ctx })=>{
        const userId = ctx.session.user.id;
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const [expenses, budgets] = await Promise.all([
            ctx.db.expense.findMany({
                where: {
                    userId,
                    date: {
                        gte: startOfMonth
                    }
                },
                include: {
                    category: true
                },
                orderBy: {
                    amount: "desc"
                }
            }),
            ctx.db.budget.findMany({
                where: {
                    userId
                },
                include: {
                    category: true
                }
            })
        ]);
        if (expenses.length === 0) {
            return {
                score: 85,
                insights: [
                    "No expenses logged this month yet — great start!",
                    "Set up budgets to track your spending goals.",
                    "Add your first expense to get personalized insights."
                ],
                tip: "Start by adding your daily expenses to build a spending profile.",
                topCategories: [],
                totalSpent: 0
            };
        }
        // Build summary
        const totalSpent = expenses.reduce((sum, e)=>sum + e.amount, 0);
        const totalBudget = budgets.reduce((sum, b)=>sum + b.amount, 0);
        const categoryMap = new Map();
        expenses.forEach((e)=>{
            const cat = e.category?.name ?? "Other";
            categoryMap.set(cat, (categoryMap.get(cat) ?? 0) + e.amount);
        });
        const topCategories = Array.from(categoryMap.entries()).sort((a, b)=>b[1] - a[1]).slice(0, 5).map(([name, amount])=>({
                name,
                amount
            }));
        const expenseSummary = topCategories.map(({ name, amount })=>`${name}: ₹${amount.toFixed(2)}`).join(", ");
        const prompt = `You are a personal finance AI coach. Analyze this monthly spending data and provide insights:

Total spent: ₹${totalSpent.toFixed(2)}
Total budget: ${totalBudget > 0 ? `₹${totalBudget.toFixed(2)}` : "Not set"}
Budget utilization: ${totalBudget > 0 ? `${(totalSpent / totalBudget * 100).toFixed(1)}%` : "N/A"}
Top spending categories: ${expenseSummary}
Number of transactions: ${expenses.length}

Return ONLY valid JSON (no markdown):
{
  "score": <number 0-100, financial health score>,
  "insights": [<string>, <string>, <string>],
  "tip": "<string, one actionable tip>"
}`;
        try {
            const result = await model.generateContent(prompt);
            const text = result.response.text();
            try {
                const parsed = JSON.parse(text);
                return {
                    ...parsed,
                    topCategories,
                    totalSpent
                };
            } catch  {
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    return {
                        ...parsed,
                        topCategories,
                        totalSpent
                    };
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
                    "Keep tracking your expenses!"
                ],
                tip: "Consistency in tracking leads to better financial health.",
                topCategories,
                totalSpent
            };
        }
    })
});
}),
"[project]/src/server/routers/income.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "incomeRouter",
    ()=>incomeRouter
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/external.js [app-route] (ecmascript) <export * as z>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$trpc$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/server/trpc.ts [app-route] (ecmascript)");
;
;
const incomeRouter = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$trpc$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["router"])({
    list: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$trpc$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["protectedProcedure"].input(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        startDate: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].date().optional(),
        endDate: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].date().optional(),
        limit: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().min(1).max(100).default(50),
        cursor: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional()
    }).optional()).query(async ({ ctx, input })=>{
        const userId = ctx.session.user.id;
        const incomes = await ctx.db.income.findMany({
            where: {
                userId,
                ...input?.startDate || input?.endDate ? {
                    date: {
                        ...input.startDate && {
                            gte: input.startDate
                        },
                        ...input.endDate && {
                            lte: input.endDate
                        }
                    }
                } : {}
            },
            orderBy: {
                date: "desc"
            },
            take: input?.limit ?? 50,
            ...input?.cursor && {
                skip: 1,
                cursor: {
                    id: input.cursor
                }
            }
        });
        return incomes;
    }),
    getMonthTotal: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$trpc$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["protectedProcedure"].query(async ({ ctx })=>{
        const userId = ctx.session.user.id;
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const result = await ctx.db.income.aggregate({
            where: {
                userId,
                date: {
                    gte: startOfMonth
                }
            },
            _sum: {
                amount: true
            }
        });
        return result._sum.amount ?? 0;
    }),
    getRecentIncomes: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$trpc$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["protectedProcedure"].input(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        limit: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().default(5)
    })).query(async ({ ctx, input })=>{
        const userId = ctx.session.user.id;
        return ctx.db.income.findMany({
            where: {
                userId
            },
            include: {
                category: true
            },
            orderBy: {
                date: "desc"
            },
            take: input.limit
        });
    }),
    create: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$trpc$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["protectedProcedure"].input(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        amount: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().positive(),
        source: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1),
        note: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
        date: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].date().default(()=>new Date()),
        categoryId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
        receiptUrl: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional()
    })).mutation(async ({ ctx, input })=>{
        return ctx.db.income.create({
            data: {
                ...input,
                userId: ctx.session.user.id
            }
        });
    }),
    update: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$trpc$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["protectedProcedure"].input(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
        amount: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().positive().optional(),
        source: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1).optional(),
        note: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
        date: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].date().optional(),
        categoryId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
        receiptUrl: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional()
    })).mutation(async ({ ctx, input })=>{
        const { id, ...data } = input;
        return ctx.db.income.update({
            where: {
                id,
                userId: ctx.session.user.id
            },
            data
        });
    }),
    delete: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$trpc$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["protectedProcedure"].input(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()
    })).mutation(async ({ ctx, input })=>{
        return ctx.db.income.delete({
            where: {
                id: input.id,
                userId: ctx.session.user.id
            }
        });
    })
});
}),
"[externals]/child_process [external] (child_process, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("child_process", () => require("child_process"));

module.exports = mod;
}),
"[externals]/fs [external] (fs, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("fs", () => require("fs"));

module.exports = mod;
}),
"[externals]/stream [external] (stream, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("stream", () => require("stream"));

module.exports = mod;
}),
"[externals]/os [external] (os, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("os", () => require("os"));

module.exports = mod;
}),
"[externals]/process [external] (process, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("process", () => require("process"));

module.exports = mod;
}),
"[externals]/path [external] (path, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("path", () => require("path"));

module.exports = mod;
}),
"[externals]/http2 [external] (http2, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("http2", () => require("http2"));

module.exports = mod;
}),
"[project]/src/server/routers/gmail.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "gmailRouter",
    ()=>gmailRouter
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$trpc$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/server/trpc.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$googleapis$2f$build$2f$src$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/googleapis/build/src/index.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$google$2f$generative$2d$ai$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@google/generative-ai/dist/index.mjs [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$trpc$2f$server$2f$dist$2f$tracked$2d$Bjtgv3wJ$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@trpc/server/dist/tracked-Bjtgv3wJ.mjs [app-route] (ecmascript)");
;
;
;
;
const genAI = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$google$2f$generative$2d$ai$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GoogleGenerativeAI"](process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash"
});
const gmailRouter = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$trpc$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["router"])({
    syncCurrentMonth: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$trpc$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["protectedProcedure"].mutation(async ({ ctx })=>{
        const userId = ctx.session.user.id;
        // 1. Fetch User's Specific Gmail Refresh Token
        const user = await ctx.db.user.findUnique({
            where: {
                id: userId
            },
            select: {
                gmailRefreshToken: true
            }
        });
        if (!user || !user.gmailRefreshToken) {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$trpc$2f$server$2f$dist$2f$tracked$2d$Bjtgv3wJ$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TRPCError"]({
                code: "UNAUTHORIZED",
                message: "Gmail not connected. Please go to Settings to connect your Gmail account for AI Sync."
            });
        }
        // 2. Setup OAuth2 Client
        const oauth2Client = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$googleapis$2f$build$2f$src$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["google"].auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
        oauth2Client.setCredentials({
            refresh_token: user.gmailRefreshToken
        });
        const gmail = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$googleapis$2f$build$2f$src$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["google"].gmail({
            version: "v1",
            auth: oauth2Client
        });
        // 3. Construct Query for Current Month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const afterDate = startOfMonth.toISOString().split("T")[0].replace(/-/g, "/"); // YYYY/MM/DD
        const query = `after:${afterDate} (receipt OR invoice OR paid OR order OR received OR payment)`;
        let messages = [];
        try {
            const res = await gmail.users.messages.list({
                userId: "me",
                q: query,
                maxResults: 20
            });
            messages = res.data.messages || [];
        } catch (error) {
            const status = error?.response?.status || error?.code;
            const errorMsg = error?.response?.data?.error?.message || error?.message || "Unknown error";
            console.error("Gmail API Error:", status, errorMsg);
            if (status === 403 || status === "403") {
                throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$trpc$2f$server$2f$dist$2f$tracked$2d$Bjtgv3wJ$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TRPCError"]({
                    code: "FORBIDDEN",
                    message: `Gmail access denied: ${errorMsg}. Make sure the Gmail API is enabled in your Google Cloud Console.`
                });
            }
            if (status === 401 || status === "401") {
                throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$trpc$2f$server$2f$dist$2f$tracked$2d$Bjtgv3wJ$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TRPCError"]({
                    code: "UNAUTHORIZED",
                    message: "Gmail token expired. Please sign out and sign back in to refresh your access."
                });
            }
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$trpc$2f$server$2f$dist$2f$tracked$2d$Bjtgv3wJ$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TRPCError"]({
                code: "INTERNAL_SERVER_ERROR",
                message: `Failed to fetch emails: ${errorMsg}`
            });
        }
        if (messages.length === 0) {
            return {
                added: 0,
                message: "No new receipt emails found this month."
            };
        }
        // 4. Fetch Email Contents
        const emailContents = [];
        for (const msg of messages){
            if (!msg.id) continue;
            try {
                const fullMsg = await gmail.users.messages.get({
                    userId: "me",
                    id: msg.id,
                    format: "full"
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
            return {
                added: 0,
                message: "No readable receipt emails found."
            };
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
        let parsedData = [];
        try {
            const result = await model.generateContent(prompt);
            const text = result.response.text();
            try {
                parsedData = JSON.parse(text);
            } catch  {
                const jsonMatch = text.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                    parsedData = JSON.parse(jsonMatch[0]);
                } else {
                    throw new Error(`Gemini returned invalid JSON format. Response was: ${text.substring(0, 50)}...`);
                }
            }
        } catch (error) {
            console.error("Gemini Parsing Error", error);
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$trpc$2f$server$2f$dist$2f$tracked$2d$Bjtgv3wJ$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TRPCError"]({
                code: "INTERNAL_SERVER_ERROR",
                message: `Failed to analyze emails: ${error.message || "Unknown Gemini error"}`
            });
        }
        if (!Array.isArray(parsedData) || parsedData.length === 0) {
            return {
                added: 0,
                message: "AI found no clear transactions in the fetched emails."
            };
        }
        // 6. Save to Database with Duplicate Prevention
        let addedCount = 0;
        // Pre-fetch user's categories for mapping
        const userCategories = await ctx.db.category.findMany({
            where: {
                userId
            }
        });
        for (const item of parsedData){
            if (!item.amount || !item.merchant || !item.type) continue;
            // Duplicate Check
            if (item.type === "expense") {
                const exists = await ctx.db.expense.findFirst({
                    where: {
                        userId,
                        amount: item.amount,
                        merchant: {
                            contains: item.merchant,
                            mode: "insensitive"
                        },
                        date: {
                            gte: startOfMonth
                        }
                    }
                });
                if (exists) continue;
            } else {
                const exists = await ctx.db.income.findFirst({
                    where: {
                        userId,
                        amount: item.amount,
                        source: {
                            contains: item.merchant,
                            mode: "insensitive"
                        },
                        date: {
                            gte: startOfMonth
                        }
                    }
                });
                if (exists) continue;
            }
            // Category Matching
            let categoryId = undefined;
            if (item.category) {
                const matchedCat = userCategories.find((c)=>c.name.toLowerCase().includes(item.category.toLowerCase()));
                if (matchedCat) {
                    categoryId = matchedCat.id;
                } else {
                    // Auto-create category if AI guessed a solid one
                    try {
                        const newCat = await ctx.db.category.create({
                            data: {
                                userId,
                                name: item.category,
                                icon: "circle",
                                color: "#8E8E93"
                            }
                        });
                        categoryId = newCat.id;
                        userCategories.push(newCat);
                    } catch  {}
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
                        date: new Date()
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
                        date: new Date()
                    }
                });
                addedCount++;
            }
        }
        return {
            added: addedCount,
            message: `Successfully synced ${addedCount} transactions from Gmail.`
        };
    })
});
}),
"[project]/src/server/routers/index.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "appRouter",
    ()=>appRouter
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$trpc$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/server/trpc.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$routers$2f$expense$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/server/routers/expense.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$routers$2f$category$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/server/routers/category.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$routers$2f$budget$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/server/routers/budget.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$routers$2f$ai$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/server/routers/ai.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$routers$2f$income$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/server/routers/income.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$routers$2f$gmail$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/server/routers/gmail.ts [app-route] (ecmascript)");
;
;
;
;
;
;
;
const appRouter = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$trpc$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["router"])({
    expense: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$routers$2f$expense$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["expenseRouter"],
    income: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$routers$2f$income$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["incomeRouter"],
    category: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$routers$2f$category$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["categoryRouter"],
    budget: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$routers$2f$budget$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["budgetRouter"],
    ai: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$routers$2f$ai$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["aiRouter"],
    gmail: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$routers$2f$gmail$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["gmailRouter"]
});
}),
"[project]/src/app/api/trpc/[trpc]/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>handler,
    "POST",
    ()=>handler
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$trpc$2f$server$2f$dist$2f$adapters$2f$fetch$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@trpc/server/dist/adapters/fetch/index.mjs [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$trpc$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/server/trpc.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$routers$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/server/routers/index.ts [app-route] (ecmascript)");
;
;
;
const handler = (req)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$trpc$2f$server$2f$dist$2f$adapters$2f$fetch$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["fetchRequestHandler"])({
        endpoint: "/api/trpc",
        req,
        router: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$routers$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["appRouter"],
        createContext: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$trpc$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createTRPCContext"],
        onError: ("TURBOPACK compile-time truthy", 1) ? ({ path, error })=>{
            console.error(`❌ tRPC error on '${path}':`, error);
        } : "TURBOPACK unreachable"
    });
;
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__5ade6ad0._.js.map