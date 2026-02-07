import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function GET() {
  const { error, tenant } = await requirePermission("dashboard:read");
  if (error) return error;
  const tid = tenant.tenantId;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const upcomingPayables = await prisma.payable.findMany({
    where: { paid: false, type: "payable", tenantId: tid },
    orderBy: { dueDate: "asc" },
    take: 5,
  });

  const overdueCount = await prisma.payable.count({
    where: { paid: false, type: "payable", dueDate: { lt: now }, tenantId: tid },
  });

  const recurrings = await prisma.recurring.findMany({ where: { active: true, tenantId: tid } });
  const recurringStatus = recurrings.map((r) => ({
    id: r.id, description: r.description, amount: r.amount, type: r.type, frequency: r.frequency, dayOfMonth: r.dayOfMonth,
  }));

  const monthTransactions = await prisma.transaction.findMany({
    where: { date: { gte: startOfMonth, lte: endOfMonth }, tenantId: tid },
    select: { description: true },
  });
  const txDescriptions = new Set(monthTransactions.map((t) => t.description.toLowerCase()));
  const recurringWithStatus = recurringStatus.map((r) => ({
    ...r, processed: txDescriptions.has(r.description.toLowerCase()),
  }));

  const goals = await prisma.savingsGoal.findMany({ where: { tenantId: tid }, orderBy: { createdAt: "desc" }, take: 3 });
  const goalsProgress = goals.map((g) => ({
    id: g.id, name: g.name, targetAmount: g.targetAmount, currentAmount: g.currentAmount,
    progress: g.targetAmount > 0 ? Math.min(100, (g.currentAmount / g.targetAmount) * 100) : 0,
    deadline: g.deadline,
  }));

  const daysWithTx = await prisma.transaction.groupBy({
    by: ["date"],
    where: { date: { gte: startOfMonth, lte: endOfMonth }, tenantId: tid },
    _count: true,
  });
  const calendarDots = daysWithTx.map((d) => ({ date: d.date, count: d._count }));

  return NextResponse.json({ upcomingPayables, overdueCount, recurringWithStatus, goalsProgress, calendarDots });
}
