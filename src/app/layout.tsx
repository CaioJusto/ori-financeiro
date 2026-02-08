import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/layout/providers";
import { Sidebar } from "@/components/layout/sidebar";
import { CommandPaletteWrapper } from "@/components/command-palette-wrapper";
import { BreadcrumbsWrapper } from "@/components/breadcrumbs-wrapper";
import { Onboarding } from "@/components/onboarding";
import { ProductTour } from "@/components/product-tour";
import { KeyboardShortcutsOverlay } from "@/components/keyboard-shortcuts-overlay";
import { ChangelogModal } from "@/components/changelog-modal";
import { QuickActions } from "@/components/quick-actions";
import { PwaPrompts } from "@/components/pwa-prompts";
import { ChatWidget } from "@/components/chat-widget";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Dashboard | Ori Financeiro",
  description: "Sistema de gestão financeira pessoal e empresarial",
  manifest: "/manifest.json",
  themeColor: "#7c3aed",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>💰</text></svg>",
    apple: "/icon-192.svg",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:text-sm">
          Pular para o conteúdo
        </a>
        <Providers>
          <Onboarding />
          <ProductTour />
          <KeyboardShortcutsOverlay />
          <ChangelogModal />
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
        </Providers>
      </body>
    </html>
  );
}
