import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  const { error, tenant } = await requirePermission("balance-history:read");
  if (error) return error;
  const { searchParams } = new URL(req.url);
  const accountId = searchParams.get("accountId");
  const days = parseInt(searchParams.get("days") || "30");

  const since = new Date();
  since.setDate(since.getDate() - days);

  const where: { date: { gte: Date }; accountId?: string; tenantId: string } = { date: { gte: since }, tenantId: tenant.tenantId };
  if (accountId) where.accountId = accountId;

  const history = await prisma.balanceHistory.findMany({
    where,
    orderBy: { date: "asc" },
    include: { account: { select: { name: true, color: true } } },
  });

  return NextResponse.json(history);
}

export async function POST() {
  const { error, tenant } = await requirePermission("balance-history:write");
  if (error) return error;
  const tid = tenant.tenantId;

  const accounts = await prisma.account.findMany({
    where: { tenantId: tid },
    include: { transactions: true, transfersFrom: true, transfersTo: true },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const results = [];
  for (const a of accounts) {
    const income = a.transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = a.transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const transferIn = a.transfersTo.reduce((s, t) => s + t.amount, 0);
    const transferOut = a.transfersFrom.reduce((s, t) => s + t.amount, 0);
    const balance = income - expense + transferIn - transferOut;

    const entry = await prisma.balanceHistory.upsert({
      where: { accountId_date: { accountId: a.id, date: today } },
      update: { balance },
      create: { accountId: a.id, balance, date: today, tenantId: tid },
    });
    results.push(entry);
  }

  return NextResponse.json(results);
}
