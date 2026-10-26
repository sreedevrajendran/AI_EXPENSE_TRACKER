import { Header } from "@/components/layout/Header";
import { StorageStatusBanner } from "@/components/layout/StorageStatusBanner";
import { BottomTabBar } from "@/components/layout/BottomTabBar";
import { DesktopSidebar } from "@/components/layout/DesktopSidebar";
import { TermsAcceptanceModal } from "@/components/auth/TermsAcceptanceModal";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-col md:flex-row min-h-dvh bg-[var(--ios-bg)]">
            <DesktopSidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <Header />
                <StorageStatusBanner />
                <main className="flex-1 pb-[calc(49px+env(safe-area-inset-bottom,0px)+16px)] md:pb-6">
                    {children}
                </main>
                <BottomTabBar />
                <TermsAcceptanceModal />
            </div>
        </div>
    );
}
