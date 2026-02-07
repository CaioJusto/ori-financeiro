import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  const { error, tenant } = await requirePermission("transactions.view");
  if (error) return error;

  const q = req.nextUrl.searchParams.get("q")?.trim() || "";
  if (q.length < 2) return NextResponse.json({ results: [] });

  const tid = tenant.tenantId;

  // Parse natural language queries
  const nlResult = parseNaturalLanguage(q);

  const [transactions, accounts, categories, contacts, invoices, goals, tags] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        tenantId: tid,
        ...(nlResult?.categoryFilter
          ? { category: { name: { contains: nlResult.categoryFilter, mode: "insensitive" as const } } }
          : { description: { contains: q, mode: "insensitive" as const } }),
        ...(nlResult?.dateFrom ? { date: { gte: nlResult.dateFrom, ...(nlResult.dateTo ? { lte: nlResult.dateTo } : {}) } } : {}),
      },
      include: { category: true, account: true },
      take: 10,
      orderBy: { date: "desc" },
    }),
    prisma.account.findMany({
      where: { tenantId: tid, name: { contains: q, mode: "insensitive" } },
      take: 5,
    }),
    prisma.category.findMany({
      where: { tenantId: tid, name: { contains: q, mode: "insensitive" } },
      take: 5,
    }),
    prisma.contact.findMany({
      where: { tenantId: tid, OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] },
      take: 5,
    }),
    prisma.invoice.findMany({
      where: { tenantId: tid, OR: [{ clientName: { contains: q, mode: "insensitive" } }, { number: { contains: q, mode: "insensitive" } }] },
      take: 5,
    }),
    prisma.savingsGoal.findMany({
      where: { tenantId: tid, name: { contains: q, mode: "insensitive" } },
      take: 5,
    }),
    prisma.tag.findMany({
      where: { tenantId: tid, name: { contains: q, mode: "insensitive" } },
      take: 5,
    }),
  ]);

  // Quick actions parsing
  const quickActions = parseQuickActions(q);

  // Aggregate for NL queries
  let nlAggregate = null;
  if (nlResult?.categoryFilter && transactions.length > 0) {
    const total = transactions.reduce((s, t) => s + (t.type === "expense" ? t.amount : -t.amount), 0);
    nlAggregate = {
      query: q,
      total: Math.abs(total),
      count: transactions.length,
      category: nlResult.categoryFilter,
    };
  }

  return NextResponse.json({
    results: {
      transactions: transactions.map(t => ({
        id: t.id, label: t.description, amount: t.amount, type: t.type,
        date: t.date, category: t.category?.name, account: t.account?.name,
        entityType: "transaction", href: "/transactions",
      })),
      accounts: accounts.map(a => ({
        id: a.id, label: a.name, entityType: "account", href: "/accounts",
      })),
      categories: categories.map(c => ({
        id: c.id, label: c.name, type: c.type, entityType: "category", href: "/categories",
      })),
      contacts: contacts.map(c => ({
        id: c.id, label: c.name, description: c.email, entityType: "contact", href: "/contacts",
      })),
      invoices: invoices.map(i => ({
        id: i.id, label: `${i.number} - ${i.clientName}`, amount: i.total, entityType: "invoice", href: "/invoices",
      })),
      goals: goals.map(g => ({
        id: g.id, label: g.name, current: g.currentAmount, target: g.targetAmount, entityType: "goal", href: "/goals",
      })),
      tags: tags.map(t => ({
        id: t.id, label: t.name, entityType: "tag", href: "/tags",
      })),
    },
    quickActions,
    nlAggregate,
  });
}

function parseNaturalLanguage(q: string) {
  const lower = q.toLowerCase();

  // "quanto gastei em alimentação em janeiro"
  const match = lower.match(/(?:quanto\s+(?:gastei|gasto)|despesas?\s+(?:com|em))\s+(.+?)(?:\s+em\s+(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro))?$/);
  if (match) {
    const category = match[1]?.trim();
    const monthNames: Record<string, number> = {
      janeiro: 0, fevereiro: 1, março: 2, abril: 3, maio: 4, junho: 5,
      julho: 6, agosto: 7, setembro: 8, outubro: 9, novembro: 10, dezembro: 11,
    };
    const monthName = match[2];
    let dateFrom: Date | undefined;
    let dateTo: Date | undefined;
    if (monthName && monthNames[monthName] !== undefined) {
      const year = new Date().getFullYear();
      const m = monthNames[monthName];
      dateFrom = new Date(year, m, 1);
      dateTo = new Date(year, m + 1, 0);
    }
    return { categoryFilter: category, dateFrom, dateTo };
  }
  return null;
}

function parseQuickActions(q: string) {
  const actions: { label: string; action: string; params: Record<string, unknown> }[] = [];
  const lower = q.toLowerCase();

  // "add R$50 to alimentação"
  const addMatch = lower.match(/(?:add|adicionar)\s+r?\$?\s*(\d+(?:[.,]\d+)?)\s+(?:to|em|para)\s+(.+)/i);
  if (addMatch) {
    actions.push({
      label: `Adicionar R$ ${addMatch[1]} em ${addMatch[2]}`,
      action: "create_transaction",
      params: { amount: parseFloat(addMatch[1].replace(",", ".")), category: addMatch[2] },
    });
  }

  // "criar fatura para João"
  const invoiceMatch = lower.match(/(?:criar?\s+(?:fatura|invoice)\s+(?:para|for))\s+(.+)/i);
  if (invoiceMatch) {
    actions.push({
      label: `Criar fatura para ${invoiceMatch[1]}`,
      action: "create_invoice",
      params: { clientName: invoiceMatch[1] },
    });
  }

  return actions;
}
