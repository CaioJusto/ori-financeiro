import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  const { error, tenant } = await requirePermission("dashboard:read");
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
  const type = searchParams.get("type");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activities: any[] = [];

  // Recent transactions
  if (!type || type === "transaction") {
    const transactions = await prisma.transaction.findMany({
      where: { tenantId: tenant.tenantId },
      include: { account: { select: { name: true } }, category: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: (page - 1) * limit,
    });
    transactions.forEach((t) => {
      activities.push({
        id: `tx-${t.id}`,
        type: "transaction",
        icon: t.type === "income" ? "💰" : "💸",
        title: t.type === "income" ? "Receita registrada" : "Despesa registrada",
        description: `${t.description} — R$ ${t.amount.toFixed(2)} em ${t.account.name}`,
        timestamp: t.createdAt,
      });
    });
  }

  // Budget alerts
  if (!type || type === "budget") {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const budgets = await prisma.budget.findMany({
      where: { tenantId: tenant.tenantId, month },
      include: { category: true },
    });
    const monthTransactions = await prisma.transaction.findMany({
      where: { tenantId: tenant.tenantId, type: "expense", date: { gte: new Date(now.getFullYear(), now.getMonth(), 1) } },
    });
    budgets.forEach((b) => {
      const spent = monthTransactions.filter((t) => t.categoryId === b.categoryId).reduce((s, t) => s + t.amount, 0);
      const pct = b.amount > 0 ? (spent / b.amount) * 100 : 0;
      if (pct >= 80) {
        activities.push({
          id: `budget-${b.id}`,
          type: "budget",
          icon: pct >= 100 ? "🚨" : "⚠️",
          title: pct >= 100 ? "Orçamento excedido!" : "Orçamento próximo do limite",
          description: `Orçamento "${b.category.name}" atingiu ${Math.round(pct)}%`,
          timestamp: new Date(),
        });
      }
    });
  }

  // Goal milestones
  if (!type || type === "goal") {
    const goals = await prisma.savingsGoal.findMany({ where: { tenantId: tenant.tenantId } });
    goals.forEach((g) => {
      const pct = g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0;
      if (pct >= 50 && pct < 100) {
        activities.push({
          id: `goal-${g.id}`,
          type: "goal",
          icon: "🎯",
          title: "Meta em progresso",
          description: `Meta "${g.name}" atingiu ${Math.round(pct)}%`,
          timestamp: g.createdAt,
        });
      }
      if (pct >= 100) {
        activities.push({
          id: `goal-done-${g.id}`,
          type: "achievement",
          icon: "🏆",
          title: "Meta alcançada!",
          description: `Parabéns! Meta "${g.name}" foi completada!`,
          timestamp: g.createdAt,
        });
      }
    });
  }

  // Notifications as system events
  if (!type || type === "system") {
    const notifications = await prisma.notification.findMany({
      where: { tenantId: tenant.tenantId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    notifications.forEach((n) => {
      activities.push({
        id: `notif-${n.id}`,
        type: "system",
        icon: "🔔",
        title: n.title,
        description: n.message,
        timestamp: n.createdAt,
      });
    });
  }

  // Sort by timestamp descending
  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return NextResponse.json({
    activities: activities.slice(0, limit),
    page,
    hasMore: activities.length >= limit,
  });
}
