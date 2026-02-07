"use client";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

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

export function ChangelogModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem("changelog_seen");
    if (seen !== CURRENT_VERSION) setOpen(true);
  }, []);

  const dismiss = () => {
    localStorage.setItem("changelog_seen", CURRENT_VERSION);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) dismiss(); else setOpen(v); }}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Novidades
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {changelog.map((release) => (
            <div key={release.version}>
              <div className="flex items-center gap-2 mb-3">
                <span className="font-semibold">v{release.version}</span>
                <span className="text-xs text-muted-foreground">{release.date}</span>
              </div>
              <ul className="space-y-2">
                {release.changes.map((change, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Badge variant={typeColor[change.type]} className="text-[10px] px-1.5 py-0 mt-0.5 flex-shrink-0">
                      {typeBadge[change.type]}
                    </Badge>
                    <span>{change.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <Button onClick={dismiss} className="w-full mt-2">Entendi!</Button>
      </DialogContent>
    </Dialog>
  );
}
