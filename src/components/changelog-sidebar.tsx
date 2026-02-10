"use client";
import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const CURRENT_VERSION = "2.0.0";

const changelog = [
  {
    version: "2.0.0",
    date: "2026-02-07",
    changes: [
      { type: "feature" as const, text: "Atalhos de teclado para navegação rápida" },
      { type: "feature" as const, text: "Central de Ajuda com FAQ e documentação" },
      { type: "feature" as const, text: "Tour interativo para novos usuários" },
      { type: "improvement" as const, text: "Validação de formulários aprimorada" },
      { type: "improvement" as const, text: "Performance otimizada com loading states" },
      { type: "improvement" as const, text: "Acessibilidade WCAG 2.1 AA" },
    ],
  },
  {
    version: "1.5.0",
    date: "2026-01-15",
    changes: [
      { type: "feature" as const, text: "Paleta de comandos (Ctrl+K)" },
      { type: "feature" as const, text: "Temas personalizáveis" },
      { type: "feature" as const, text: "Open Finance" },
      { type: "improvement" as const, text: "Dashboard customizável" },
    ],
  },
];

const typeBadge = { feature: "Nova", improvement: "Melhoria", fix: "Correção" };
const typeColor = { feature: "default" as const, improvement: "secondary" as const, fix: "outline" as const };

export function ChangelogSidebarButton() {
  const [open, setOpen] = useState(false);
  const [hasNew, setHasNew] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const seen = localStorage.getItem("changelog_seen");
    if (seen !== CURRENT_VERSION) setHasNew(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleOpen = () => {
    setOpen(!open);
    if (!open && hasNew) {
      localStorage.setItem("changelog_seen", CURRENT_VERSION);
      setHasNew(false);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--foreground)/0.05)] hover:text-[hsl(var(--sidebar-foreground))] w-full transition-colors"
      >
        <div className="relative">
          <Sparkles className="h-4 w-4 shrink-0" />
          {hasNew && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[hsl(var(--sidebar))]" />
          )}
        </div>
        <span>Novidades</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute bottom-full left-0 mb-1 w-80 max-h-96 overflow-y-auto rounded-lg border bg-popover shadow-lg z-50"
          >
            <div className="sticky top-0 bg-popover border-b px-4 py-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Novidades</span>
            </div>
            <div className="p-4 space-y-5">
              {changelog.map((release) => (
                <div key={release.version}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded">v{release.version}</span>
                    <span className="text-[11px] text-muted-foreground">{release.date}</span>
                  </div>
                  <ul className="space-y-1.5">
                    {release.changes.map((change, i) => (
                      <li key={i} className="flex items-start gap-2 text-[13px]">
                        <Badge variant={typeColor[change.type]} className="text-[9px] px-1.5 py-0 mt-0.5 shrink-0">
                          {typeBadge[change.type]}
                        </Badge>
                        <span className="text-muted-foreground">{change.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
