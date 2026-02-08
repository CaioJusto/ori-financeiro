import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  const { error, tenant } = await requirePermission("reports:read");
  if (error) return error;

  const months = parseInt(new URL(req.url).searchParams.get("months") || "12");
  const transactions = await prisma.transaction.findMany({ where: { tenantId: tenant.tenantId }, orderBy: { date: "desc" } });

  const now = new Date();
  const data: { month: string; income: number; expense: number; balance: number }[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const m = d.getMonth();
    const y = d.getFullYear();
    const label = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
    const monthTx = transactions.filter((t) => { const td = new Date(t.date); return td.getMonth() === m && td.getFullYear() === y; });
    const income = monthTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = monthTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    data.push({ month: label, income, expense, balance: income - expense });
  }

  return NextResponse.json(data);
}
