"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, ArrowLeftRight, Wallet, Tag, FileBarChart,
  ArrowRightLeft, Sun, Moon, Target, Repeat, PiggyBank,
  CreditCard, Upload, DollarSign, Search, User, Menu, X, Calendar,
  Bell, Maximize2, Minimize2, ClipboardList, Receipt, Settings, Palette,
  Wand2, TrendingUp, Users, Heart, ArrowUpDown, Flag, History, Share2, Calculator,
  ShieldCheck, Activity, FileText, MessageSquare, FolderOpen, Sliders,
  FileBarChart2, BarChart3, Landmark, Columns3, BookOpen, CheckSquare, Banknote, Lightbulb,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { AnimatePresence, motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { SIDEBAR_PERMISSIONS } from "@/lib/permissions";

const sections = [
  {
    label: "VISÃO GERAL",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
      { href: "/chat", label: "Chat IA", icon: MessageSquare },
      { href: "/transactions", label: "Transações", icon: ArrowLeftRight },
      { href: "/reports", label: "Relatórios", icon: FileBarChart },
      { href: "/monthly", label: "Resumo Mensal", icon: Calendar },
      { href: "/calendar", label: "Calendário", icon: Calendar },
      { href: "/compare", label: "Comparativo", icon: ArrowUpDown },
      { href: "/cashflow", label: "Fluxo de Caixa", icon: TrendingUp },
      { href: "/planning", label: "Planejamento", icon: ClipboardList },
      { href: "/analytics", label: "Analytics", icon: Activity },
      { href: "/reports/income-statement", label: "DRE", icon: FileBarChart2 },
      { href: "/reports/balance-sheet", label: "Balanço", icon: BarChart3 },
      { href: "/reports/expense-breakdown", label: "Despesas Detalhe", icon: FileBarChart },
      { href: "/reports/trend-analysis", label: "Tendências", icon: TrendingUp },
    ],
  },
  {
    label: "FINANÇAS",
    items: [
      { href: "/accounts", label: "Contas", icon: Wallet },
      { href: "/categories", label: "Categorias", icon: Tag },
      { href: "/budgets", label: "Orçamentos", icon: Target },
      { href: "/transfers", label: "Transferências", icon: ArrowRightLeft },
      { href: "/credit-cards", label: "Cartões", icon: CreditCard },
      { href: "/investments", label: "Investimentos", icon: Landmark },
      { href: "/subscriptions", label: "Assinaturas", icon: Repeat },
      { href: "/invoices", label: "Faturas", icon: FileBarChart2 },
      { href: "/loans", label: "Empréstimos", icon: Banknote },
    ],
  },
  {
    label: "GESTÃO",
    items: [
      { href: "/recurring", label: "Recorrências", icon: Repeat },
      { href: "/goals", label: "Metas", icon: PiggyBank },
      { href: "/installments", label: "Parcelas", icon: CreditCard },
      { href: "/payables", label: "Contas a Pagar", icon: Receipt },
      { href: "/tags", label: "Tags", icon: DollarSign },
      { href: "/contacts", label: "Contatos", icon: Users },
      { href: "/rules", label: "Regras Auto", icon: Wand2 },
      { href: "/projections", label: "Projeções", icon: TrendingUp },
      { href: "/bills", label: "Kanban Contas", icon: Columns3 },
      { href: "/tax", label: "Fiscal", icon: Calculator },
      { href: "/objectives", label: "Objetivos", icon: Flag },
      { href: "/simulator", label: "Simulador", icon: Calculator },
      { href: "/templates", label: "Templates", icon: FileText },
      { href: "/health", label: "Saúde Financeira", icon: Heart },
      { href: "/challenges", label: "Desafios", icon: Target },
      { href: "/documents", label: "Documentos", icon: FolderOpen },
      { href: "/audit", label: "Auditoria", icon: History },
      { href: "/notifications", label: "Notificações", icon: Bell },
      { href: "/import", label: "Importar", icon: Upload },
      { href: "/settings", label: "Configurações", icon: Settings },
      { href: "/settings/preferences", label: "Preferências", icon: Sliders },
      { href: "/settings/currencies", label: "Moedas", icon: DollarSign },
      { href: "/settings/api-keys", label: "Chaves API", icon: ShieldCheck },
      { href: "/settings/webhooks", label: "Webhooks", icon: Activity },
      { href: "/settings/users", label: "Usuários", icon: Users },
      { href: "/settings/roles", label: "Papéis", icon: ShieldCheck },
      { href: "/settings/branding", label: "Branding", icon: Palette },
      { href: "/settings/scheduled-reports", label: "Relatórios Agendados", icon: FileBarChart },
      { href: "/settings/budget-templates", label: "Templates Orçamento", icon: BookOpen },
      { href: "/approvals", label: "Aprovações", icon: CheckSquare },
      { href: "/splits", label: "Divisão Despesas", icon: Users },
      { href: "/widgets", label: "Mini-Apps", icon: Calculator },
      { href: "/settings/billing", label: "Billing & Planos", icon: CreditCard },
      { href: "/settings/security", label: "Segurança", icon: ShieldCheck },
      { href: "/tips", label: "Dicas Financeiras", icon: Lightbulb },
      { href: "/settings/mcp", label: "MCP Server", icon: Activity },
      { href: "/settings/bank-connections", label: "Bancos", icon: Landmark },
      { href: "/settings/alerts", label: "Alertas", icon: Bell },
      { href: "/settings/themes", label: "Temas", icon: Palette },
      { href: "/settings/open-finance", label: "Open Finance", icon: Landmark },
    ],
  },
  {
    label: "AVANÇADO",
    items: [
      { href: "/benchmark", label: "Benchmarking", icon: BarChart3 },
      { href: "/forecast", label: "Previsões", icon: TrendingUp },
      { href: "/snapshot", label: "Report Card", icon: FileBarChart },
      { href: "/mrr", label: "MRR", icon: DollarSign },
      { href: "/export", label: "Exportação", icon: FileText },
    ],
  },
  {
    label: "AJUDA",
    items: [
      { href: "/help", label: "Central de Ajuda", icon: Lightbulb },
      { href: "/shortcuts", label: "Atalhos de Teclado", icon: FileText },
    ],
  },
];

interface NotificationData {
  id: string; title: string; message: string; type: string; read: boolean; createdAt: string;
}

export function Sidebar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [compact, setCompact] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [colorTheme, setColorTheme] = useState<string>("default");
  const [healthScore, setHealthScore] = useState<number | null>(null);
  const [overdueCount, setOverdueCount] = useState(0);

  const userPermissions = useMemo(() => {
    const perms = (session?.user as any)?.permissions as string[] | undefined;
    return perms || [];
  }, [session]);

  const hasPermission = (permission: string): boolean => {
    if (userPermissions.includes("*")) return true;
    return userPermissions.includes(permission);
  };

  // Filter sections based on permissions
  const filteredSections = useMemo(() => {
    return sections.map(section => ({
      ...section,
      items: section.items.filter(item => {
        const requiredPerm = SIDEBAR_PERMISSIONS[item.href];
        if (!requiredPerm) return true; // No permission required
        return hasPermission(requiredPerm);
      }),
    })).filter(section => section.items.length > 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userPermissions]);

  // Load saved color theme
  useEffect(() => {
    const saved = localStorage.getItem("ori-color-theme");
    if (saved) { setColorTheme(saved); document.documentElement.setAttribute("data-color-theme", saved); }
  }, []);

  const applyColorTheme = (t: string) => {
    setColorTheme(t);
    localStorage.setItem("ori-color-theme", t);
    document.documentElement.setAttribute("data-color-theme", t);
    setShowThemeMenu(false);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const loadNotifications = () => {
    fetch("/api/notifications").then(r => r.json()).then(setNotifications);
  };

  const markRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    loadNotifications();
  };

  const markAllRead = async () => {
    await fetch("/api/notifications/mark-all-read", { method: "POST" });
    loadNotifications();
  };

  // Close on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // Load notifications periodically
  useEffect(() => {
    loadNotifications();
    fetch("/api/notifications/check", { method: "POST" }).then(() => loadNotifications());
    const interval = setInterval(() => {
      fetch("/api/notifications/check", { method: "POST" }).then(() => loadNotifications());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Load health score and overdue count
  useEffect(() => {
    fetch("/api/health-score").then(r => r.json()).then(d => setHealthScore(d.score)).catch(() => {});
    fetch("/api/dashboard/widgets").then(r => r.json()).then(d => setOverdueCount(d.overdueCount || 0)).catch(() => {});
  }, []);

  // Toggle compact mode on body
  useEffect(() => {
    document.body.classList.toggle("compact-mode", compact);
  }, [compact]);

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex items-center justify-between h-12 px-4 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-5 h-5 rounded bg-[hsl(var(--sidebar-accent))] flex items-center justify-center">
            <span className="text-[10px] font-bold text-white">O</span>
          </div>
          <span className="text-sm font-semibold text-[hsl(var(--sidebar-foreground))]">Ori Financeiro</span>
          {healthScore !== null && (
            <div className={cn("w-2 h-2 rounded-full shrink-0", healthScore >= 70 ? "bg-emerald-500" : healthScore >= 40 ? "bg-amber-500" : "bg-red-500")}
              title={`Saúde financeira: ${healthScore}/100`} />
          )}
        </div>
        <button onClick={() => setMobileOpen(false)} className="md:hidden p-1 hover:bg-[hsl(var(--foreground)/0.05)] rounded">
          <X className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
        </button>
      </div>

      {/* Search button */}
      <div className="px-3 pb-1">
        <button
          onClick={() => { document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true })); }}
          className="flex items-center gap-2 w-full rounded-md px-2.5 py-1.5 text-xs text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--foreground)/0.05)] transition-colors"
          aria-label="Busca global (Cmd+K)"
        >
          <Search className="h-3.5 w-3.5" />
          <span>Buscar...</span>
          <kbd className="ml-auto text-[10px] bg-[hsl(var(--foreground)/0.06)] px-1.5 py-0.5 rounded font-mono hidden sm:inline">⌘K</kbd>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
        {filteredSections.map((section) => (
          <div key={section.label}>
            <div className="px-2.5 mb-1.5 text-[10px] font-semibold tracking-wider text-[hsl(var(--muted-foreground))] uppercase">
              {section.label}
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = pathname === item.href;
                return (
                  <Tooltip key={item.href} delayDuration={600}>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
                          active
                            ? "bg-[hsl(var(--foreground)/0.08)] text-[hsl(var(--sidebar-foreground))] font-medium"
                            : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--foreground)/0.05)] hover:text-[hsl(var(--sidebar-foreground))]"
                        )}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span className="flex-1">{item.label}</span>
                        {item.href === "/payables" && overdueCount > 0 && (
                          <span className="w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shrink-0">
                            {overdueCount > 9 ? "9+" : overdueCount}
                          </span>
                        )}
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="text-xs hidden md:block">
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="border-t border-[hsl(var(--sidebar-border))] p-3 space-y-1">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label={`Notificações${unreadCount > 0 ? ` (${unreadCount} não lidas)` : ""}`}
            className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--foreground)/0.05)] hover:text-[hsl(var(--sidebar-foreground))] w-full transition-colors"
          >
            <div className="relative">
              <Bell className="h-4 w-4 shrink-0" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </div>
            <span>Notificações</span>
          </button>
          {showNotifications && (
            <div className="absolute bottom-full left-0 mb-1 w-80 max-h-96 overflow-y-auto rounded-lg border bg-popover shadow-lg z-50">
              <div className="flex items-center justify-between p-3 border-b">
                <span className="text-sm font-medium">Notificações</span>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-primary hover:underline">Marcar todas como lidas</button>
                )}
              </div>
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">Nenhuma notificação</div>
              ) : (
                <div className="divide-y">
                  {notifications.slice(0, 20).map(n => (
                    <button
                      key={n.id}
                      onClick={() => markRead(n.id)}
                      className={cn(
                        "w-full text-left p-3 hover:bg-muted/50 transition-colors",
                        !n.read && "bg-primary/5"
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <div className={cn(
                          "w-2 h-2 rounded-full mt-1.5 shrink-0",
                          n.type === "warning" ? "bg-amber-500" : n.type === "success" ? "bg-emerald-500" : "bg-blue-500"
                        )} />
                        <div>
                          <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                          <p className="text-[10px] text-muted-foreground/60 mt-1">{new Date(n.createdAt).toLocaleDateString("pt-BR")}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Compact mode */}
        <button
          onClick={() => setCompact(!compact)}
          aria-label={compact ? "Modo expandido" : "Modo compacto"}
          className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--foreground)/0.05)] hover:text-[hsl(var(--sidebar-foreground))] w-full transition-colors"
        >
          {compact ? <Maximize2 className="h-4 w-4 shrink-0" /> : <Minimize2 className="h-4 w-4 shrink-0" />}
          <span>{compact ? "Modo Expandido" : "Modo Compacto"}</span>
        </button>

        <div className="relative">
          <button
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--foreground)/0.05)] hover:text-[hsl(var(--sidebar-foreground))] w-full transition-colors"
          >
            <Palette className="h-4 w-4 shrink-0" />
            <span>Tema</span>
          </button>
          {showThemeMenu && (
            <div className="absolute bottom-full left-0 mb-1 w-56 rounded-lg border bg-popover shadow-lg z-50 p-2 space-y-1">
              <p className="text-[10px] font-semibold text-muted-foreground px-2 py-1 uppercase">Modo</p>
              <button onClick={() => { setTheme("light"); }} className={cn("w-full text-left text-sm px-2 py-1.5 rounded hover:bg-muted/50 flex items-center gap-2", theme === "light" && "bg-muted")}>
                <Sun className="h-3.5 w-3.5" />Claro
              </button>
              <button onClick={() => { setTheme("dark"); }} className={cn("w-full text-left text-sm px-2 py-1.5 rounded hover:bg-muted/50 flex items-center gap-2", theme === "dark" && "bg-muted")}>
                <Moon className="h-3.5 w-3.5" />Escuro
              </button>
              <Separator className="my-1" />
              <p className="text-[10px] font-semibold text-muted-foreground px-2 py-1 uppercase">Cor</p>
              {[
                { id: "default", label: "Padrão", color: "hsl(256, 77%, 60%)" },
                { id: "midnight", label: "Midnight", color: "hsl(217, 91%, 50%)" },
                { id: "forest", label: "Forest", color: "hsl(142, 71%, 40%)" },
              ].map(t => (
                <button key={t.id} onClick={() => applyColorTheme(t.id)} className={cn("w-full text-left text-sm px-2 py-1.5 rounded hover:bg-muted/50 flex items-center gap-2", colorTheme === t.id && "bg-muted")}>
                  <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: t.color }} />
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5">
          <div className="w-5 h-5 rounded-full bg-[hsl(var(--sidebar-accent))] flex items-center justify-center">
            <User className="h-3 w-3 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-[hsl(var(--sidebar-foreground))]">{session?.user?.name || "Usuário"}</span>
            <span className="text-[10px] text-[hsl(var(--muted-foreground))]">{(session?.user as any)?.role || ""}</span>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-3 left-3 z-50 md:hidden p-2 rounded-md bg-background border shadow-sm"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-[240px] flex-col border-r border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar))] hidden md:flex">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-black/50 md:hidden"
            />
            <motion.aside
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 z-50 h-screen w-[240px] flex flex-col border-r border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar))] md:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
