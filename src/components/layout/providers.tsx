"use client";
import { useEffect } from "react";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";
import { SessionProvider } from "next-auth/react";
import { BrandingProvider } from "@/components/branding-provider";
import { ScreenReaderAnnouncer } from "@/components/screen-reader-announcer";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <TooltipProvider>
          <ScreenReaderAnnouncer>
            <BrandingProvider>
              {children}
            </BrandingProvider>
            <Toaster richColors position="bottom-right" />
          </ScreenReaderAnnouncer>
        </TooltipProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
