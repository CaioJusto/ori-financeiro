import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  const { error, tenant } = await requirePermission("reports:read");
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));
  const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);

  const cards = await prisma.creditCard.findMany({ where: { tenantId: tenant.tenantId } });
  const transactions = await prisma.transaction.findMany({
    where: { creditCardId: { not: null }, date: { gte: start, lte: end }, tenantId: tenant.tenantId },
    include: { creditCard: true, category: true },
    orderBy: { date: "desc" },
  });

  const byCard = cards.map(card => {
    const cardTxs = transactions.filter(t => t.creditCardId === card.id);
    const total = cardTxs.reduce((s, t) => s + t.amount, 0);
    return {
      card: { id: card.id, name: card.name, color: card.color, cardLimit: card.cardLimit, closingDay: card.closingDay, dueDay: card.dueDay },
      total, count: cardTxs.length, transactions: cardTxs,
      usagePercent: card.cardLimit > 0 ? (total / card.cardLimit) * 100 : 0,
    };
  });

  return NextResponse.json(byCard);
}
