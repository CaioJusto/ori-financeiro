import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function GET() {
  const { error, tenant } = await requirePermission("budgets:read");
  if (error) return error;

  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const budgets = await prisma.budget.findMany({ where: { month, tenantId: tenant.tenantId }, include: { category: true } });
  const transactions = await prisma.transaction.findMany({
    where: { type: "expense", date: { gte: startOfMonth, lte: endOfMonth }, tenantId: tenant.tenantId },
  });

  const status = budgets.map((b) => {
    const spent = transactions.filter((t) => t.categoryId === b.categoryId).reduce((s, t) => s + t.amount, 0);
    return { ...b, spent, percentage: b.amount > 0 ? (spent / b.amount) * 100 : 0 };
  });

  return NextResponse.json(status);
}
