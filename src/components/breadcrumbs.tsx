"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import React from "react";

const routeLabels: Record<string, string> = {
  "": "Dashboard",
  transactions: "Transações",
  accounts: "Contas",
  categories: "Categorias",
  budgets: "Orçamentos",
  transfers: "Transferências",
  recurring: "Recorrências",
  goals: "Metas",
  installments: "Parcelas",
  payables: "Contas a Pagar",
  tags: "Tags",
  contacts: "Contatos",
  rules: "Regras Auto",
  projections: "Projeções",
  health: "Saúde Financeira",
  import: "Importar",
  settings: "Configurações",
  reports: "Relatórios",
  monthly: "Resumo Mensal",
  calendar: "Calendário",
  planning: "Planejamento",
  "credit-cards": "Cartões",
};

export function Breadcrumbs() {
  const pathname = usePathname();
  if (pathname === "/") return null;

  const segments = pathname.split("/").filter(Boolean);
  const crumbs = segments.map((seg, i) => ({
    label: routeLabels[seg] || seg,
    href: "/" + segments.slice(0, i + 1).join("/"),
  }));

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
      <Link href="/" className="hover:text-foreground transition-colors flex items-center gap-1" aria-label="Dashboard">
        <Home className="h-3.5 w-3.5" />
      </Link>
      {crumbs.map((crumb, i) => (
        <React.Fragment key={crumb.href}>
          <ChevronRight className="h-3 w-3" />
          {i === crumbs.length - 1 ? (
            <span className="text-foreground font-medium">{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="hover:text-foreground transition-colors">
              {crumb.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
