"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { CommandPaletteWrapper } from "@/components/command-palette-wrapper";
import { BreadcrumbsWrapper } from "@/components/breadcrumbs-wrapper";
import { AuthGuardModals } from "@/components/auth-guard-modals";
import { QuickActions } from "@/components/quick-actions";
import { PwaPrompts } from "@/components/pwa-prompts";
import { ChatWidget } from "@/components/chat-widget";

const AUTH_ROUTES = ["/login", "/register", "/forgot-password", "/reset-password"];

export function AuthAwareLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = AUTH_ROUTES.some(route => pathname?.startsWith(route));

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <>
      <AuthGuardModals />
      <div className="flex min-h-screen">
        <Sidebar />
        <CommandPaletteWrapper />
        <main id="main-content" className="flex-1 md:ml-[240px] min-h-screen" role="main">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <BreadcrumbsWrapper />
            {children}
          </div>
        </main>
        <QuickActions />
        <PwaPrompts />
        <ChatWidget />
      </div>
    </>
  );
}
