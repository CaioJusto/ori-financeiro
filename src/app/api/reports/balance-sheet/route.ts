import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tenantId = (session.user as any).tenantId;

  const accounts = await prisma.account.findMany({
    where: { tenantId },
    include: { transactions: true },
  });

  const loans = await prisma.loan.findMany({ where: { tenantId, status: "ACTIVE" } });

  const accountBalances = accounts.map(acc => {
    const balance = acc.transactions.reduce((s, t) => s + (t.type === "income" ? t.amount : -t.amount), 0);
    return { id: acc.id, name: acc.name, type: acc.type, color: acc.color, balance };
  });

  const assets = accountBalances.filter(a => a.balance > 0);
  const liabilityAccounts = accountBalances.filter(a => a.balance < 0);
  const totalAssets = assets.reduce((s, a) => s + a.balance, 0);
  const totalLoanLiabilities = loans.reduce((s, l) => s + l.remainingBalance, 0);
  const totalAccountLiabilities = Math.abs(liabilityAccounts.reduce((s, a) => s + a.balance, 0));
  const totalLiabilities = totalLoanLiabilities + totalAccountLiabilities;

  return NextResponse.json({
    assets,
    liabilities: [
      ...liabilityAccounts.map(a => ({ ...a, balance: Math.abs(a.balance) })),
      ...loans.map(l => ({ id: l.id, name: l.name, type: "loan", color: "#ef4444", balance: l.remainingBalance })),
    ],
    totalAssets,
    totalLiabilities,
    netWorth: totalAssets - totalLiabilities,
  });
}
