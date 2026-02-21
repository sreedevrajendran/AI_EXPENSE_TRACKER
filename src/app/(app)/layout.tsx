import { Header } from "@/components/layout/Header";
import { BottomTabBar } from "@/components/layout/BottomTabBar";
import { DesktopSidebar } from "@/components/layout/DesktopSidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-col md:flex-row min-h-dvh bg-[var(--ios-bg)]">
            <DesktopSidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <Header />
                <main className="flex-1 pb-[calc(49px+env(safe-area-inset-bottom,0px)+16px)] md:pb-6">
                    {children}
                </main>
                <BottomTabBar />
            </div>
        </div>
    );
}
