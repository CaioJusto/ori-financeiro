import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function GET() {
  return POST();
}

export async function POST() {
  const { error, tenant } = await requirePermission("notifications:read");
  if (error) return error;
  const tid = tenant.tenantId;
  const uid = tenant.userId;

  // Load user preferences
  const prefs = await prisma.userPreference.findUnique({ where: { userId: uid } });
  const settings = await prisma.tenantSettings.findUnique({ where: { tenantId: tid } });
  const warnPct = settings?.budgetWarningPercent ?? 80;
  const critPct = settings?.budgetCriticalPercent ?? 100;
  const lowThreshold = settings?.lowBalanceThreshold ?? 500;

  // Check budgets
  if (prefs?.notifyBudgetExceeded !== false) {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const budgets = await prisma.budget.findMany({ where: { tenantId: tid, month }, include: { category: true } });
    for (const b of budgets) {
      const spent = await prisma.transaction.aggregate({
        where: { tenantId: tid, categoryId: b.categoryId, type: "expense", date: { gte: new Date(now.getFullYear(), now.getMonth(), 1), lt: new Date(now.getFullYear(), now.getMonth() + 1, 1) } },
        _sum: { amount: true },
      });
      const total = spent._sum.amount || 0;
      const pct = (total / b.amount) * 100;
      if (pct >= critPct) {
        const exists = await prisma.notification.findFirst({ where: { tenantId: tid, userId: uid, title: { contains: b.category.name }, message: { contains: "100%" }, createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) } } });
        if (!exists) {
          await prisma.notification.create({ data: { userId: uid, title: `Orçamento ${b.category.name} estourado!`, message: `Você gastou ${pct.toFixed(0)}% do orçamento de ${b.category.name}.`, type: "error", link: "/budgets", tenantId: tid } });
        }
      } else if (pct >= warnPct) {
        const exists = await prisma.notification.findFirst({ where: { tenantId: tid, userId: uid, title: { contains: b.category.name }, message: { contains: `${warnPct}%` }, createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) } } });
        if (!exists) {
          await prisma.notification.create({ data: { userId: uid, title: `Orçamento ${b.category.name} em alerta`, message: `Você atingiu ${pct.toFixed(0)}% (limite: ${warnPct}%) do orçamento.`, type: "warning", link: "/budgets", tenantId: tid } });
        }
      }
    }
  }

  // Check low balance
  if (prefs?.notifyLowBalance !== false) {
    const accounts = await prisma.account.findMany({ where: { tenantId: tid }, include: { transactions: true, transfersFrom: true, transfersTo: true } });
    for (const a of accounts) {
      const income = a.transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
      const expense = a.transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
      const tIn = a.transfersTo.reduce((s, t) => s + t.amount, 0);
      const tOut = a.transfersFrom.reduce((s, t) => s + t.amount, 0);
      const balance = income - expense + tIn - tOut;
      if (balance < lowThreshold && balance >= 0) {
        const exists = await prisma.notification.findFirst({ where: { tenantId: tid, userId: uid, title: { contains: a.name }, type: "warning", createdAt: { gte: new Date(Date.now() - 86400000) } } });
        if (!exists) {
          await prisma.notification.create({ data: { userId: uid, title: `Saldo baixo: ${a.name}`, message: `O saldo está em R$ ${balance.toFixed(2)}, abaixo do limite de R$ ${lowThreshold.toFixed(2)}.`, type: "warning", link: "/accounts", tenantId: tid } });
        }
      }
    }
  }

  // Check goals milestones
  if (prefs?.notifyGoalMilestone !== false) {
    const goals = await prisma.savingsGoal.findMany({ where: { tenantId: tid } });
    for (const g of goals) {
      const pct = (g.currentAmount / g.targetAmount) * 100;
      const milestones = [25, 50, 75, 100];
      for (const m of milestones) {
        if (pct >= m) {
          const exists = await prisma.notification.findFirst({ where: { tenantId: tid, userId: uid, title: { contains: g.name }, message: { contains: `${m}%` } } });
          if (!exists) {
            await prisma.notification.create({ data: { userId: uid, title: `Meta "${g.name}" - ${m}%!`, message: `Você atingiu ${m}% da meta "${g.name}".`, type: m === 100 ? "success" : "info", link: "/goals", tenantId: tid } });
          }
        }
      }
    }
  }

  return NextResponse.json({ ok: true });
}
