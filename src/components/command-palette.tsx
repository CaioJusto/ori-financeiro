"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "cmdk";
import { LayoutDashboard, ArrowLeftRight, Wallet, Tag, FileBarChart, Target, Repeat, PiggyBank, CreditCard, Upload, Settings, Calendar, Users, Heart, TrendingUp, Wand2, Receipt, ClipboardList, ArrowRightLeft, DollarSign, Search } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";

interface SearchResult {
  id: string;
  label: string;
  description?: string;
  type: "page" | "transaction" | "account" | "category" | "contact" | "invoice" | "goal" | "tag" | "action";
  href: string;
}

const pages: SearchResult[] = [
  { id: "p-dash", label: "Dashboard", type: "page", href: "/" },
  { id: "p-trans", label: "Transações", type: "page", href: "/transactions" },
  { id: "p-rep", label: "Relatórios", type: "page", href: "/reports" },
  { id: "p-month", label: "Resumo Mensal", type: "page", href: "/monthly" },
  { id: "p-cal", label: "Calendário", type: "page", href: "/calendar" },
  { id: "p-plan", label: "Planejamento", type: "page", href: "/planning" },
  { id: "p-acc", label: "Contas", type: "page", href: "/accounts" },
  { id: "p-cat", label: "Categorias", type: "page", href: "/categories" },
  { id: "p-bud", label: "Orçamentos", type: "page", href: "/budgets" },
  { id: "p-xfer", label: "Transferências", type: "page", href: "/transfers" },
  { id: "p-cc", label: "Cartões", type: "page", href: "/credit-cards" },
  { id: "p-rec", label: "Recorrências", type: "page", href: "/recurring" },
  { id: "p-goals", label: "Metas", type: "page", href: "/goals" },
  { id: "p-inst", label: "Parcelas", type: "page", href: "/installments" },
  { id: "p-pay", label: "Contas a Pagar", type: "page", href: "/payables" },
  { id: "p-tags", label: "Tags", type: "page", href: "/tags" },
  { id: "p-cont", label: "Contatos", type: "page", href: "/contacts" },
  { id: "p-rules", label: "Regras Auto", type: "page", href: "/rules" },
  { id: "p-proj", label: "Projeções", type: "page", href: "/projections" },
  { id: "p-health", label: "Saúde Financeira", type: "page", href: "/health" },
  { id: "p-imp", label: "Importar", type: "page", href: "/import" },
  { id: "p-set", label: "Configurações", type: "page", href: "/settings" },
  { id: "p-bench", label: "Benchmarking", type: "page", href: "/benchmark" },
  { id: "p-forecast", label: "Previsões", type: "page", href: "/forecast" },
  { id: "p-snap", label: "Report Card", type: "page", href: "/snapshot" },
  { id: "p-mrr", label: "MRR", type: "page", href: "/mrr" },
  { id: "p-export", label: "Exportação", type: "page", href: "/export" },
  { id: "p-openfinance", label: "Open Finance", type: "page", href: "/settings/open-finance" },
];

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  page: LayoutDashboard,
  transaction: ArrowLeftRight,
  account: Wallet,
  category: Tag,
  contact: Users,
  invoice: Receipt,
  goal: PiggyBank,
  tag: DollarSign,
  action: Wand2,
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const router = useRouter();
  const debouncedQuery = useDebounce(query, 200);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(o => !o);
        setQuery("");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Enhanced search using /api/search
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setResults([]);
      return;
    }

    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then(r => r.json())
      .then(data => {
        const r: SearchResult[] = [];

        // Quick actions
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (data.quickActions || []).forEach((a: any, i: number) => {
          r.push({ id: `qa-${i}`, label: a.label, type: "action", href: "/transactions" });
        });

        // NL aggregate
        if (data.nlAggregate) {
          r.push({ id: "nl-agg", label: `Total: ${formatCurrency(data.nlAggregate.total)} (${data.nlAggregate.count} transações)`, description: data.nlAggregate.category, type: "transaction", href: "/transactions" });
        }

        const results = data.results || {};
        // Transactions
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (results.transactions || []).forEach((t: any) => {
          r.push({ id: `t-${t.id}`, label: t.label, description: t.amount ? formatCurrency(t.amount) : undefined, type: "transaction", href: t.href });
        });
        // Accounts
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (results.accounts || []).forEach((a: any) => {
          r.push({ id: `a-${a.id}`, label: a.label, type: "account", href: a.href });
        });
        // Categories
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (results.categories || []).forEach((c: any) => {
          r.push({ id: `c-${c.id}`, label: c.label, type: "category", href: c.href });
        });
        // Contacts
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (results.contacts || []).forEach((c: any) => {
          r.push({ id: `co-${c.id}`, label: c.label, description: c.description, type: "contact", href: c.href });
        });
        // Invoices
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (results.invoices || []).forEach((i: any) => {
          r.push({ id: `inv-${i.id}`, label: i.label, description: i.amount ? formatCurrency(i.amount) : undefined, type: "invoice", href: i.href });
        });
        // Goals
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (results.goals || []).forEach((g: any) => {
          r.push({ id: `g-${g.id}`, label: g.label, description: g.target ? `${formatCurrency(g.current)} / ${formatCurrency(g.target)}` : undefined, type: "goal", href: g.href });
        });
        // Tags
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (results.tags || []).forEach((t: any) => {
          r.push({ id: `tag-${t.id}`, label: t.label, type: "tag", href: t.href });
        });

        setResults(r);
      })
      .catch(() => setResults([]));
  }, [debouncedQuery]);

  const filteredPages = query
    ? pages.filter(p => p.label.toLowerCase().includes(query.toLowerCase()))
    : pages;

  const select = useCallback((href: string) => {
    router.push(href);
    setOpen(false);
  }, [router]);

  const groupedResults: Record<string, SearchResult[]> = {};
  results.forEach(r => {
    const key = r.type;
    if (!groupedResults[key]) groupedResults[key] = [];
    groupedResults[key].push(r);
  });

  const typeLabels: Record<string, string> = {
    action: "Ações Rápidas",
    transaction: "Transações",
    account: "Contas",
    category: "Categorias",
    contact: "Contatos",
    invoice: "Faturas",
    goal: "Metas",
    tag: "Tags",
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 max-w-[520px] overflow-hidden" aria-describedby={undefined}>
        <Command className="rounded-lg border-0" shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground mr-2" />
            <CommandInput
              placeholder="Buscar páginas, transações, contas..."
              value={query}
              onValueChange={setQuery}
              className="h-11 border-0 focus:ring-0 outline-none"
            />
            <kbd className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono text-muted-foreground">ESC</kbd>
          </div>
          <CommandList className="max-h-[360px] overflow-y-auto p-1">
            <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">Nenhum resultado encontrado.</CommandEmpty>

            {/* Data results */}
            {Object.entries(groupedResults).map(([type, items]) => (
              <CommandGroup key={type} heading={typeLabels[type] || type} className="px-1">
                {items.map(item => {
                  const Icon = typeIcons[item.type] || LayoutDashboard;
                  return (
                    <CommandItem
                      key={item.id}
                      value={item.id}
                      onSelect={() => select(item.href)}
                      className="flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer text-sm"
                    >
                      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.description && <span className="text-xs text-muted-foreground">{item.description}</span>}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ))}

            {/* Pages */}
            <CommandGroup heading="Páginas" className="px-1">
              {filteredPages.map(p => (
                <CommandItem
                  key={p.id}
                  value={p.id}
                  onSelect={() => select(p.href)}
                  className="flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer text-sm"
                >
                  <LayoutDashboard className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{p.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
