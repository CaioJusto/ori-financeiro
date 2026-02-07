import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  const { error, tenant } = await requirePermission("reports:read");
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const from1 = searchParams.get("from1");
  const to1 = searchParams.get("to1");
  const from2 = searchParams.get("from2");
  const to2 = searchParams.get("to2");

  if (!from1 || !to1 || !from2 || !to2) {
    return NextResponse.json({ error: "from1, to1, from2, to2 required" }, { status: 400 });
  }

  const [period1, period2] = await Promise.all([
    prisma.transaction.findMany({
      where: { date: { gte: new Date(from1), lte: new Date(to1 + "T23:59:59") }, tenantId: tenant.tenantId },
      include: { category: true, account: true },
    }),
    prisma.transaction.findMany({
      where: { date: { gte: new Date(from2), lte: new Date(to2 + "T23:59:59") }, tenantId: tenant.tenantId },
      include: { category: true, account: true },
    }),
  ]);

  const summarize = (txs: typeof period1) => {
    const income = txs.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = txs.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const byCategory: Record<string, { name: string; income: number; expense: number }> = {};
    txs.forEach(t => {
      const key = t.category.name;
      if (!byCategory[key]) byCategory[key] = { name: key, income: 0, expense: 0 };
      if (t.type === "income") byCategory[key].income += t.amount;
      else byCategory[key].expense += t.amount;
    });
    return { income, expense, balance: income - expense, count: txs.length, byCategory: Object.values(byCategory) };
  };

  return NextResponse.json({ period1: summarize(period1), period2: summarize(period2) });
}
