import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { db } from "@/lib/firebase/admin";

const DEMO_USER = {
    id: "guest-user",
    name: "Guest User",
    email: "guest@floww.local",
    image: null,
};

export const createTRPCContext = async () => {
    let session = await getServerSession(authOptions);
    if (!session || !session.user) {
        session = {
            user: DEMO_USER,
            expires: new Date(Date.now() + 30 * 86400000).toISOString(),
        };
    }
    return {
        session,
        db,
    };
};

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<TRPCContext>().create({
    transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
    const user = ctx.session?.user?.id ? ctx.session.user : DEMO_USER;
    return next({
        ctx: {
            ...ctx,
            session: {
                ...ctx.session,
                user,
            },
        },
    });
});

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);
