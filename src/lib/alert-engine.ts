import { prisma } from "@/lib/prisma";

interface AlertCondition {
  type: string;
  value?: number;
  categoryId?: string;
  days?: number;
}

interface AlertAction {
  type: string;
  webhookUrl?: string;
}

export async function evaluateAlerts(tenantId: string, context?: { transactionAmount?: number; transactionType?: string; categoryId?: string; accountId?: string }) {
  const rules = await prisma.alertRule.findMany({ where: { tenantId, active: true } });

  for (const rule of rules) {
    const condition = rule.condition as unknown as AlertCondition;
    const action = rule.action as unknown as AlertAction;
    let triggered = false;

    if (condition.type === "transaction_amount_above" && context?.transactionAmount && condition.value) {
      triggered = context.transactionAmount > condition.value;
    }

    if (condition.type === "income_received" && context?.transactionType === "income") {
      triggered = true;
    }

    if (condition.type === "spending_category_exceeds" && condition.categoryId && condition.value) {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const spent = await prisma.transaction.aggregate({
        where: { tenantId, categoryId: condition.categoryId, type: "expense", date: { gte: monthStart } },
        _sum: { amount: true },
      });
      triggered = (spent._sum.amount || 0) > condition.value;
    }

    if (condition.type === "balance_below" && condition.value && context?.accountId) {
      const account = await prisma.account.findFirst({
        where: { id: context.accountId, tenantId },
        include: { transactions: true, transfersFrom: true, transfersTo: true },
      });
      if (account) {
        const inc = account.transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
        const exp = account.transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
        const tIn = account.transfersTo.reduce((s, t) => s + t.amount, 0);
        const tOut = account.transfersFrom.reduce((s, t) => s + t.amount, 0);
        triggered = (inc - exp + tIn - tOut) < condition.value;
      }
    }

    if (triggered) {
      // Execute action
      if (action.type === "create_notification") {
        await prisma.notification.create({
          data: {
            title: `⚠️ Alerta: ${rule.name}`,
            message: `A regra "${rule.name}" foi ativada`,
            type: "warning",
            tenantId,
          },
        });
      }

      if (action.type === "send_webhook" && action.webhookUrl) {
        try {
          await fetch(action.webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ alert: rule.name, condition, context, triggeredAt: new Date().toISOString() }),
          });
        } catch { /* ignore webhook failures */ }
      }

      await prisma.alertRule.update({
        where: { id: rule.id },
        data: { lastTriggered: new Date(), triggerCount: { increment: 1 } },
      });
    }
  }
}
