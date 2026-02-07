import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function GET() {
  const { error, tenant } = await requirePermission("backup:read");
  if (error) return error;
  const tid = tenant.tenantId;

  const data = {
    accounts: await prisma.account.findMany({ where: { tenantId: tid } }),
    categories: await prisma.category.findMany({ where: { tenantId: tid } }),
    transactions: await prisma.transaction.findMany({ where: { tenantId: tid } }),
    creditCards: await prisma.creditCard.findMany({ where: { tenantId: tid } }),
    notifications: await prisma.notification.findMany({ where: { tenantId: tid } }),
    balanceHistory: await prisma.balanceHistory.findMany({ where: { tenantId: tid } }),
    transfers: await prisma.transfer.findMany({ where: { tenantId: tid } }),
    budgets: await prisma.budget.findMany({ where: { tenantId: tid } }),
    recurring: await prisma.recurring.findMany({ where: { tenantId: tid } }),
    tags: await prisma.tag.findMany({ where: { tenantId: tid } }),
    transactionTags: await prisma.transactionTag.findMany({ where: { transaction: { tenantId: tid } } }),
    savingsGoals: await prisma.savingsGoal.findMany({ where: { tenantId: tid } }),
    installments: await prisma.installment.findMany({ where: { tenantId: tid } }),
    plannings: await prisma.planning.findMany({ where: { tenantId: tid } }),
    payables: await prisma.payable.findMany({ where: { tenantId: tid } }),
    exportedAt: new Date().toISOString(),
  };
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="ori-backup-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
