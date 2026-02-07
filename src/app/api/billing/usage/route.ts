import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ usage: { users: 0, accounts: 0, transactionsThisMonth: 0 } });
  const tenantId = (session.user as Record<string, unknown>).tenantId as string;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [users, accounts, transactionsThisMonth] = await Promise.all([
    prisma.user.count({ where: { tenantId } }),
    prisma.account.count({ where: { tenantId } }),
    prisma.transaction.count({ where: { tenantId, createdAt: { gte: startOfMonth } } }),
  ]);

  return NextResponse.json({ usage: { users, accounts, transactionsThisMonth } });
}
