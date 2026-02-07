import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenant } = await requirePermission("credit-cards:read");
  if (error) return error;
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const monthParam = searchParams.get("month");

  const card = await prisma.creditCard.findUnique({ where: { id, tenantId: tenant.tenantId } });
  if (!card) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const now = new Date();
  const [year, month] = monthParam
    ? monthParam.split("-").map(Number)
    : [now.getFullYear(), now.getMonth() + 1];

  const closingDay = card.closingDay;
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;

  const startDate = new Date(prevYear, prevMonth - 1, closingDay + 1);
  const endDate = new Date(year, month - 1, closingDay, 23, 59, 59);

  const transactions = await prisma.transaction.findMany({
    where: { creditCardId: id, date: { gte: startDate, lte: endDate }, tenantId: tenant.tenantId },
    include: { category: true, account: true },
    orderBy: { date: "desc" },
  });

  const total = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  return NextResponse.json({
    card,
    period: { start: startDate, end: endDate },
    dueDate: new Date(year, month - 1, card.dueDay),
    transactions,
    total,
  });
}
