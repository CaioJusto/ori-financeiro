"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";

function hexToHSL(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function adjustLightness(hsl: string, delta: number): string {
  const parts = hsl.split(" ");
  const l = parseInt(parts[2]);
  return `${parts[0]} ${parts[1]} ${Math.max(0, Math.min(100, l + delta))}%`;
}

export interface BrandingData {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  sidebarColor: string;
  themeMode: string;
  logoUrl: string | null;
  logoBase64: string | null;
  faviconBase64: string | null;
  systemName: string;
  favicon: string | null;
}

interface BrandingContextType {
  branding: BrandingData | null;
  refresh: () => void;
}

const BrandingContext = createContext<BrandingContextType>({ branding: null, refresh: () => {} });

export function useBranding() {
  return useContext(BrandingContext);
}

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const { setTheme } = useTheme();
  const [branding, setBranding] = useState<BrandingData | null>(null);

  const refresh = useCallback(() => {
    fetch("/api/tenant")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        setBranding(data);
        applyBranding(data);
      })
      .catch(() => {});
  }, []);

  function applyBranding(data: BrandingData) {
    const root = document.documentElement;
    const isDark = root.classList.contains("dark");

    if (data.primaryColor) {
      const hsl = hexToHSL(data.primaryColor);
      root.style.setProperty("--primary", hsl);
      root.style.setProperty("--ring", hsl);
      root.style.setProperty("--sidebar-accent", hsl);
      root.style.setProperty("--accent", hsl);
    }

    if (data.secondaryColor) {
      const hsl = hexToHSL(data.secondaryColor);
      root.style.setProperty("--secondary", hsl);
    }

    if (data.backgroundColor) {
      const hsl = hexToHSL(data.backgroundColor);
      root.style.setProperty("--background", hsl);
      // Derive card and popover from background
      root.style.setProperty("--card", isDark ? adjustLightness(hsl, 4) : hsl);
      root.style.setProperty("--popover", isDark ? adjustLightness(hsl, 4) : hsl);
    }

    if (data.textColor) {
      const hsl = hexToHSL(data.textColor);
      root.style.setProperty("--foreground", hsl);
      root.style.setProperty("--card-foreground", hsl);
      root.style.setProperty("--popover-foreground", hsl);
    }

    if (data.sidebarColor) {
      const hsl = hexToHSL(data.sidebarColor);
      root.style.setProperty("--sidebar", hsl);
      root.style.setProperty("--sidebar-border", isDark ? adjustLightness(hsl, 8) : adjustLightness(hsl, -8));
    }

    if (data.systemName) {
      document.title = data.systemName;
    }

    // Apply favicon
    const faviconSrc = data.faviconBase64 || data.favicon;
    if (faviconSrc) {
      let link = document.querySelector("link[rel='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = faviconSrc;
    }

    // Apply theme mode
    if (data.themeMode && data.themeMode !== "system") {
      setTheme(data.themeMode);
    }
  }

  useEffect(() => {
    if (status !== "authenticated") return;
    refresh();
  }, [status, refresh]);

  return (
    <BrandingContext.Provider value={{ branding, refresh }}>
      {children}
    </BrandingContext.Provider>
  );
}
