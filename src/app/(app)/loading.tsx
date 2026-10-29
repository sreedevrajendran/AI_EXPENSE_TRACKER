export default function AppLoading() {
    return (
        <div className="px-4 pt-3 pb-32 space-y-4 md:px-8 md:pt-6 animate-pulse">
            {/* Header / Greeting Placeholder */}
            <div className="h-8 w-44 rounded-xl bg-neutral-200/60 dark:bg-neutral-800/60 mb-2" />

            {/* Hero Card Placeholder */}
            <div className="w-full h-44 rounded-[32px] bg-gradient-to-br from-blue-500/20 via-indigo-500/15 to-purple-500/20 border border-white/20 dark:border-white/5 relative overflow-hidden p-6 space-y-4">
                <div className="h-4 w-28 rounded-md bg-white/20" />
                <div className="h-10 w-48 rounded-xl bg-white/30" />
                <div className="h-px w-full bg-white/10" />
                <div className="grid grid-cols-2 gap-4">
                    <div className="h-12 rounded-xl bg-white/10" />
                    <div className="h-12 rounded-xl bg-white/10" />
                </div>
            </div>

            {/* Chart / Quick Stat Placeholder */}
            <div className="w-full h-48 rounded-[28px] bg-white/60 dark:bg-[#1C1C1E]/60 border border-neutral-200/50 dark:border-neutral-800/50 p-5 space-y-3">
                <div className="flex justify-between items-center">
                    <div className="h-4 w-32 rounded bg-neutral-200 dark:bg-neutral-800" />
                    <div className="h-6 w-20 rounded-full bg-neutral-200 dark:bg-neutral-800" />
                </div>
                <div className="h-32 w-full rounded-2xl bg-neutral-100 dark:bg-neutral-800/40" />
            </div>

            {/* Recent Items List Placeholders */}
            <div className="space-y-2.5 pt-2">
                <div className="h-4 w-20 rounded bg-neutral-200 dark:bg-neutral-800" />
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="h-16 rounded-2xl bg-white/60 dark:bg-[#1C1C1E]/60 border border-neutral-200/50 dark:border-neutral-800/50 p-3.5 flex items-center gap-3"
                    >
                        <div className="w-10 h-10 rounded-xl bg-neutral-200 dark:bg-neutral-800 flex-shrink-0" />
                        <div className="flex-1 space-y-1.5">
                            <div className="h-4 w-28 rounded bg-neutral-200 dark:bg-neutral-800" />
                            <div className="h-3 w-16 rounded bg-neutral-200/70 dark:bg-neutral-800/70" />
                        </div>
                        <div className="h-4 w-16 rounded bg-neutral-200 dark:bg-neutral-800" />
                    </div>
                ))}
            </div>
        </div>
    );
}
