import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

async function getWidgetToken(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") || req.headers.get("x-widget-token");
  if (!token) return null;
  return prisma.widgetToken.findFirst({ where: { token, active: true } });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const widget = await getWidgetToken(req);
  if (!widget) return NextResponse.json({ error: "Invalid widget token" }, { status: 401 });
  if (widget.expiresAt && widget.expiresAt < new Date()) return NextResponse.json({ error: "Token expired" }, { status: 401 });

  const tenantId = widget.tenantId;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET",
  };

  if (type === "balance-summary") {
    const accounts = await prisma.account.findMany({
      where: { tenantId },
      include: { transactions: true, transfersFrom: true, transfersTo: true },
    });
    const data = accounts.map((a) => {
      const inc = a.transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
      const exp = a.transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
      const tIn = a.transfersTo.reduce((s, t) => s + t.amount, 0);
      const tOut = a.transfersFrom.reduce((s, t) => s + t.amount, 0);
      return { name: a.name, balance: inc - exp + tIn - tOut };
    });
    const total = data.reduce((s, a) => s + a.balance, 0);
    return NextResponse.json({ total, accounts: data }, { headers: corsHeaders });
  }

  if (type === "spending-chart") {
    const transactions = await prisma.transaction.findMany({
      where: { tenantId, type: "expense", date: { gte: monthStart } },
      include: { category: true },
    });
    const byCategory = new Map<string, number>();
    transactions.forEach((t) => byCategory.set(t.category.name, (byCategory.get(t.category.name) || 0) + t.amount));
    return NextResponse.json({
      month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
      categories: Array.from(byCategory.entries()).map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount),
    }, { headers: corsHeaders });
  }

  if (type === "budget-progress") {
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const budgets = await prisma.budget.findMany({ where: { tenantId, month }, include: { category: true } });
    const transactions = await prisma.transaction.findMany({ where: { tenantId, type: "expense", date: { gte: monthStart } } });
    return NextResponse.json({
      budgets: budgets.map((b) => {
        const spent = transactions.filter((t) => t.categoryId === b.categoryId).reduce((s, t) => s + t.amount, 0);
        return { category: b.category.name, budgeted: b.amount, spent, percent: b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0 };
      }),
    }, { headers: corsHeaders });
  }

  if (type === "goal-progress") {
    const goals = await prisma.savingsGoal.findMany({ where: { tenantId } });
    return NextResponse.json({
      goals: goals.map((g) => ({
        name: g.name, target: g.targetAmount, current: g.currentAmount,
        percent: g.targetAmount > 0 ? Math.round((g.currentAmount / g.targetAmount) * 100) : 0,
      })),
    }, { headers: corsHeaders });
  }

  return NextResponse.json({ error: "Unknown widget type" }, { status: 404 });
}
