"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Keyboard } from "lucide-react";

interface ShortcutGroup {
  title: string;
  shortcuts: { keys: string[]; description: string }[];
}

const shortcutGroups: ShortcutGroup[] = [
  {
    title: "Navegação",
    shortcuts: [
      { keys: ["g", "d"], description: "Ir para Dashboard" },
      { keys: ["g", "t"], description: "Ir para Transações" },
      { keys: ["g", "a"], description: "Ir para Contas" },
      { keys: ["g", "r"], description: "Ir para Relatórios" },
      { keys: ["g", "s"], description: "Ir para Configurações" },
      { keys: ["g", "b"], description: "Ir para Orçamentos" },
      { keys: ["g", "g"], description: "Ir para Metas" },
      { keys: ["g", "c"], description: "Ir para Categorias" },
    ],
  },
  {
    title: "Ações",
    shortcuts: [
      { keys: ["n"], description: "Nova transação" },
      { keys: ["/"], description: "Focar na busca" },
      { keys: ["Ctrl", "k"], description: "Abrir paleta de comandos" },
      { keys: ["Escape"], description: "Fechar modal / Voltar" },
    ],
  },
  {
    title: "Listas",
    shortcuts: [
      { keys: ["j"], description: "Próximo item" },
      { keys: ["k"], description: "Item anterior" },
      { keys: ["Enter"], description: "Abrir item selecionado" },
    ],
  },
  {
    title: "Geral",
    shortcuts: [
      { keys: ["?"], description: "Mostrar atalhos de teclado" },
    ],
  },
];

export { shortcutGroups };

export function KeyboardShortcutsOverlay() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [pendingG, setPendingG] = useState(false);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable;

      if (isInput) return;

      // ? to show shortcuts
      if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }

      // g + key navigation
      if (e.key === "g" && !e.ctrlKey && !e.metaKey && !pendingG) {
        setPendingG(true);
        setTimeout(() => setPendingG(false), 1000);
        return;
      }

      if (pendingG) {
        setPendingG(false);
        const routes: Record<string, string> = {
          d: "/", t: "/transactions", a: "/accounts", r: "/reports",
          s: "/settings", b: "/budgets", g: "/goals", c: "/categories",
        };
        if (routes[e.key]) {
          e.preventDefault();
          router.push(routes[e.key]);
          return;
        }
      }

      // / to focus search
      if (e.key === "/" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>('input[type="text"][placeholder*="uscar"], input[type="search"], input[data-search]');
        if (searchInput) searchInput.focus();
        return;
      }

      // n for new transaction
      if (e.key === "n" && !e.ctrlKey && !e.metaKey) {
        const btn = document.querySelector<HTMLButtonElement>('[data-action="new"]');
        if (btn) { e.preventDefault(); btn.click(); }
        return;
      }

      // j/k for list navigation
      if (e.key === "j" || e.key === "k") {
        const rows = document.querySelectorAll<HTMLTableRowElement>("table tbody tr");
        if (rows.length === 0) return;
        e.preventDefault();
        const current = document.querySelector<HTMLTableRowElement>("table tbody tr[data-selected='true']");
        let idx = current ? Array.from(rows).indexOf(current) : -1;
        if (e.key === "j") idx = Math.min(idx + 1, rows.length - 1);
        else idx = Math.max(idx - 1, 0);
        rows.forEach((r) => { r.removeAttribute("data-selected"); r.classList.remove("bg-muted/50"); });
        rows[idx].setAttribute("data-selected", "true");
        rows[idx].classList.add("bg-muted/50");
        rows[idx].scrollIntoView({ block: "nearest" });
      }

      // Escape
      if (e.key === "Escape") {
        setOpen(false);
      }
    },
    [pendingG, router]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Atalhos de Teclado
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {shortcutGroups.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">{group.title}</h3>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5">
                    <span className="text-sm">{shortcut.description}</span>
                    <div className="flex gap-1">
                      {shortcut.keys.map((key, j) => (
                        <span key={j}>
                          {j > 0 && <span className="text-muted-foreground text-xs mx-0.5">+</span>}
                          <kbd className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 text-xs font-medium bg-muted border rounded">
                            {key}
                          </kbd>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
