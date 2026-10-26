"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { useState } from "react";
import superjson from "superjson";
import type { AppRouter } from "@/server/routers";

import { isQuotaError, flagQuotaExceeded } from "@/lib/firebase/errorHandler";

export const trpc = createTRPCReact<AppRouter>();

export function TRPCProvider({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 1000 * 30,
                gcTime: 1000 * 60 * 5,
                refetchOnWindowFocus: false,
                retry: (failureCount, error: any) => {
                    if (isQuotaError(error)) {
                        flagQuotaExceeded(error?.message);
                        return false;
                    }
                    const msg = String(error?.message || "");
                    if (msg.includes("UNAUTHORIZED")) {
                        return false;
                    }
                    return failureCount < 1;
                },
            },
            mutations: {
                retry: false,
                onError: (error: any) => {
                    if (isQuotaError(error)) {
                        flagQuotaExceeded(error?.message);
                    }
                },
            },
        },
    }));

    const [trpcClient] = useState(() =>
        trpc.createClient({
            links: [
                httpBatchLink({
                    url: "/api/trpc",
                    transformer: superjson,
                }),
            ],
        })
    );

    return (
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </trpc.Provider>
    );
}
