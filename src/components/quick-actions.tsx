"use client";
import { useState, useEffect } from "react";
import { Plus, ArrowRightLeft, Receipt, FileText, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";

interface DaySummary {
  income: number;
  expense: number;
  count: number;
}

const actions = [
  { icon: Plus, label: "Nova Transação", href: "/transactions", color: "bg-emerald-500" },
  { icon: ArrowRightLeft, label: "Nova Transferência", href: "/transfers", color: "bg-blue-500" },
  { icon: Receipt, label: "Conta a Pagar", href: "/payables", color: "bg-amber-500" },
  { icon: FileText, label: "Resumo do Dia", href: "#summary", color: "bg-violet-500" },
];

export function QuickActions() {
  const [open, setOpen] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState<DaySummary | null>(null);

  useEffect(() => {
    if (showSummary) {
      const today = new Date().toISOString().slice(0, 10);
      fetch(`/api/transactions?from=${today}&to=${today}`)
        .then(r => r.json())
        .then((txs: { type: string; amount: number }[]) => {
          setSummary({
            income: txs.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0),
            expense: txs.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0),
            count: txs.length,
          });
        });
    }
  }, [showSummary]);

  const handleAction = (href: string) => {
    if (href === "#summary") {
      setShowSummary(true);
    }
    setOpen(false);
  };

  return (
    <>
      {/* FAB */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col-reverse items-end gap-3">
        <AnimatePresence>
          {open && actions.map((action, i) => (
            <motion.div
              key={action.label}
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              transition={{ delay: i * 0.05, duration: 0.2 }}
            >
              {action.href === "#summary" ? (
                <button
                  onClick={() => handleAction(action.href)}
                  className="flex items-center gap-3 group"
                >
                  <span className="bg-popover border rounded-lg px-3 py-1.5 text-sm font-medium shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {action.label}
                  </span>
                  <div className={`${action.color} w-10 h-10 rounded-full flex items-center justify-center shadow-lg text-white hover:scale-110 transition-transform`}>
                    <action.icon className="h-4 w-4" />
                  </div>
                </button>
              ) : (
                <Link href={action.href} onClick={() => setOpen(false)} className="flex items-center gap-3 group">
                  <span className="bg-popover border rounded-lg px-3 py-1.5 text-sm font-medium shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {action.label}
                  </span>
                  <div className={`${action.color} w-10 h-10 rounded-full flex items-center justify-center shadow-lg text-white hover:scale-110 transition-transform`}>
                    <action.icon className="h-4 w-4" />
                  </div>
                </Link>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        <button
          onClick={() => setOpen(!open)}
          className={`w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 ${open ? "rotate-45" : ""}`}
        >
          {open ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
        </button>
      </div>

      {/* Day Summary Modal */}
      <Dialog open={showSummary} onOpenChange={setShowSummary}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Resumo do Dia</DialogTitle></DialogHeader>
          {summary ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border text-center">
                  <p className="text-sm text-muted-foreground">Receitas</p>
                  <p className="text-lg font-bold text-emerald-500">{formatCurrency(summary.income)}</p>
                </div>
                <div className="p-4 rounded-lg border text-center">
                  <p className="text-sm text-muted-foreground">Despesas</p>
                  <p className="text-lg font-bold text-red-500">{formatCurrency(summary.expense)}</p>
                </div>
              </div>
              <div className="p-4 rounded-lg border text-center">
                <p className="text-sm text-muted-foreground">Saldo do Dia</p>
                <p className={`text-xl font-bold ${summary.income - summary.expense >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                  {formatCurrency(summary.income - summary.expense)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{summary.count} transações</p>
              </div>
            </div>
          ) : (
            <div className="animate-pulse text-center py-8 text-muted-foreground">Carregando...</div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
