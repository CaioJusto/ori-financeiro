"use client";

import { usePathname } from "next/navigation";
import { Onboarding } from "@/components/onboarding";
import { ProductTour } from "@/components/product-tour";
import { KeyboardShortcutsOverlay } from "@/components/keyboard-shortcuts-overlay";

const AUTH_ROUTES = ["/login", "/register", "/forgot-password", "/reset-password"];

export function AuthGuardModals() {
  const pathname = usePathname();
  
  // Don't show modals on auth pages
  if (AUTH_ROUTES.some(route => pathname?.startsWith(route))) {
    return null;
  }

  return (
    <>
      <Onboarding />
      <ProductTour />
      <KeyboardShortcutsOverlay />
    </>
  );
}
