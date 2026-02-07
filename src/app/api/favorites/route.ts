import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function GET() {
  const { error, tenant } = await requirePermission("favorites:read");
  if (error) return error;
  const tid = tenant.tenantId;

  const [accounts, categories, transactions] = await Promise.all([
    prisma.account.findMany({
      where: { favorite: true, tenantId: tid },
      include: { transactions: true, transfersFrom: true, transfersTo: true },
    }),
    prisma.category.findMany({ where: { favorite: true, tenantId: tid } }),
    prisma.transaction.findMany({
      where: { favorite: true, tenantId: tid },
      include: { account: true, category: true },
      orderBy: { date: "desc" },
      take: 10,
    }),
  ]);

  const accountsWithBalance = accounts.map(a => {
    const income = a.transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = a.transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const transferIn = a.transfersTo.reduce((s, t) => s + t.amount, 0);
    const transferOut = a.transfersFrom.reduce((s, t) => s + t.amount, 0);
    return { ...a, balance: income - expense + transferIn - transferOut, transactions: undefined, transfersFrom: undefined, transfersTo: undefined };
  });

  return NextResponse.json({ accounts: accountsWithBalance, categories, transactions });
}

export async function PUT(req: NextRequest) {
  const { error, tenant } = await requirePermission("favorites:write");
  if (error) return error;
  const { type, id, favorite } = await req.json();

  if (type === "account") {
    await prisma.account.update({ where: { id, tenantId: tenant.tenantId }, data: { favorite } });
  } else if (type === "category") {
    await prisma.category.update({ where: { id, tenantId: tenant.tenantId }, data: { favorite } });
  } else if (type === "transaction") {
    await prisma.transaction.update({ where: { id, tenantId: tenant.tenantId }, data: { favorite } });
  }

  return NextResponse.json({ ok: true });
}
