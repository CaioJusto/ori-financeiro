import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  const { error, tenant } = await requirePermission("export:read");
  if (error) return error;
  const tid = tenant.tenantId;

  const { searchParams } = new URL(req.url);
  const accountId = searchParams.get("accountId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: Record<string, unknown> = { tenantId: tid };
  if (accountId) where.accountId = accountId;
  if (from || to) {
    where.date = {};
    if (from) (where.date as Record<string, unknown>).gte = new Date(from);
    if (to) (where.date as Record<string, unknown>).lte = new Date(to);
  }

  const [accounts, transactions] = await Promise.all([
    prisma.account.findMany({ where: { tenantId: tid }, include: { transactions: true, transfersFrom: true, transfersTo: true } }),
    prisma.transaction.findMany({ where, include: { account: true, category: true }, orderBy: { date: "desc" } }),
  ]);

  const accountBalances = accounts.map((a) => {
    const income = a.transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = a.transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const transferIn = a.transfersTo.reduce((s, t) => s + t.amount, 0);
    const transferOut = a.transfersFrom.reduce((s, t) => s + t.amount, 0);
    return { id: a.id, name: a.name, balance: income - expense + transferIn - transferOut };
  });

  const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  const catMap = new Map<string, { name: string; total: number }>();
  for (const t of transactions.filter((t) => t.type === "expense")) {
    const e = catMap.get(t.categoryId) || { name: t.category.name, total: 0 };
    e.total += t.amount;
    catMap.set(t.categoryId, e);
  }
  const topCategories = Array.from(catMap.values()).sort((a, b) => b.total - a.total).slice(0, 10);

  const monthMap = new Map<string, { income: number; expense: number }>();
  for (const t of transactions) {
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const e = monthMap.get(key) || { income: 0, expense: 0 };
    if (t.type === "income") e.income += t.amount;
    else e.expense += t.amount;
    monthMap.set(key, e);
  }
  const monthlyEvolution = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({ month, ...data }));

  return NextResponse.json({
    accountBalances, totalIncome, totalExpense, netBalance: totalIncome - totalExpense,
    topCategories, monthlyEvolution,
  });
}
