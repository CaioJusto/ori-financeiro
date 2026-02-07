"use client";
import { useEffect } from "react";
import { useSession } from "next-auth/react";

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

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession();

  useEffect(() => {
    if (status !== "authenticated") return;

    fetch("/api/tenant")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        const root = document.documentElement;
        if (data.primaryColor) {
          root.style.setProperty("--primary", hexToHSL(data.primaryColor));
        }
        if (data.accentColor) {
          root.style.setProperty("--accent", hexToHSL(data.accentColor));
        }
        if (data.systemName) {
          document.title = data.systemName;
        }
      })
      .catch(() => {});
  }, [status]);

  return <>{children}</>;
}
