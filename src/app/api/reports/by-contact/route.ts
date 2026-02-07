import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  const { error, tenant } = await requirePermission("reports:read");
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { contactId: { not: null }, tenantId: tenant.tenantId };
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from);
    if (to) where.date.lte = new Date(to + "T23:59:59");
  }

  const transactions = await prisma.transaction.findMany({
    where,
    include: { contact: true, category: true },
    orderBy: { date: "desc" },
  });

  const byContact: Record<string, { name: string; income: number; expense: number; count: number }> = {};
  transactions.forEach(t => {
    const name = t.contact?.name || "Sem contato";
    if (!byContact[name]) byContact[name] = { name, income: 0, expense: 0, count: 0 };
    if (t.type === "income") byContact[name].income += t.amount;
    else byContact[name].expense += t.amount;
    byContact[name].count++;
  });

  return NextResponse.json(Object.values(byContact).sort((a, b) => (b.income + b.expense) - (a.income + a.expense)));
}
