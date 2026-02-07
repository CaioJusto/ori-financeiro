export interface ThemeConfig {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  card: string;
  muted: string;
}

export const themes: ThemeConfig[] = [
  { id: "default", name: "Default (Violet)", primary: "#7c3aed", secondary: "#6d28d9", accent: "#8b5cf6", background: "#ffffff", foreground: "#09090b", card: "#ffffff", muted: "#f4f4f5" },
  { id: "ocean", name: "Ocean (Blue)", primary: "#0284c7", secondary: "#0369a1", accent: "#38bdf8", background: "#ffffff", foreground: "#0c4a6e", card: "#ffffff", muted: "#f0f9ff" },
  { id: "forest", name: "Forest (Green)", primary: "#16a34a", secondary: "#15803d", accent: "#4ade80", background: "#ffffff", foreground: "#14532d", card: "#ffffff", muted: "#f0fdf4" },
  { id: "sunset", name: "Sunset (Orange)", primary: "#ea580c", secondary: "#c2410c", accent: "#fb923c", background: "#ffffff", foreground: "#431407", card: "#ffffff", muted: "#fff7ed" },
  { id: "rose", name: "Rose (Pink)", primary: "#e11d48", secondary: "#be123c", accent: "#fb7185", background: "#ffffff", foreground: "#4c0519", card: "#ffffff", muted: "#fff1f2" },
  { id: "midnight", name: "Midnight (Dark Blue)", primary: "#3b82f6", secondary: "#2563eb", accent: "#60a5fa", background: "#0f172a", foreground: "#e2e8f0", card: "#1e293b", muted: "#334155" },
  { id: "monochrome", name: "Monochrome", primary: "#404040", secondary: "#525252", accent: "#737373", background: "#ffffff", foreground: "#171717", card: "#ffffff", muted: "#f5f5f5" },
];

export function getThemeById(id: string): ThemeConfig {
  return themes.find((t) => t.id === id) || themes[0];
}

export function themeToCssVars(theme: ThemeConfig): Record<string, string> {
  return {
    "--theme-primary": theme.primary,
    "--theme-secondary": theme.secondary,
    "--theme-accent": theme.accent,
    "--theme-background": theme.background,
    "--theme-foreground": theme.foreground,
    "--theme-card": theme.card,
    "--theme-muted": theme.muted,
  };
}
