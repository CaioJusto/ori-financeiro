import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function POST(req: NextRequest) {
  const { error, tenant } = await requirePermission("backup:read");
  if (error) return error;
  const tid = tenant.tenantId;

  try {
    const data = await req.json();

    // Delete all existing data for this tenant in order
    await prisma.transactionTag.deleteMany({ where: { transaction: { tenantId: tid } } });
    await prisma.transactionSplit.deleteMany({ where: { tenantId: tid } });
    await prisma.attachment.deleteMany({ where: { tenantId: tid } });
    await prisma.transaction.deleteMany({ where: { tenantId: tid } });
    await prisma.balanceHistory.deleteMany({ where: { tenantId: tid } });
    await prisma.transfer.deleteMany({ where: { tenantId: tid } });
    await prisma.budget.deleteMany({ where: { tenantId: tid } });
    await prisma.recurring.deleteMany({ where: { tenantId: tid } });
    await prisma.installment.deleteMany({ where: { tenantId: tid } });
    await prisma.planning.deleteMany({ where: { tenantId: tid } });
    await prisma.payable.deleteMany({ where: { tenantId: tid } });
    await prisma.goalDeposit.deleteMany({ where: { tenantId: tid } });
    await prisma.savingsGoal.deleteMany({ where: { tenantId: tid } });
    await prisma.notification.deleteMany({ where: { tenantId: tid } });
    await prisma.creditCard.deleteMany({ where: { tenantId: tid } });
    await prisma.tag.deleteMany({ where: { tenantId: tid } });
    await prisma.category.deleteMany({ where: { tenantId: tid } });
    await prisma.account.deleteMany({ where: { tenantId: tid } });

    // Restore with tenant
    if (data.accounts?.length) await prisma.account.createMany({ data: data.accounts.map((a: Record<string, unknown>) => ({ ...a, tenantId: tid, createdAt: new Date(a.createdAt as string) })) });
    if (data.categories?.length) await prisma.category.createMany({ data: data.categories.map((c: Record<string, unknown>) => ({ ...c, tenantId: tid, createdAt: new Date(c.createdAt as string) })) });
    if (data.creditCards?.length) await prisma.creditCard.createMany({ data: data.creditCards.map((c: Record<string, unknown>) => ({ ...c, tenantId: tid, createdAt: new Date(c.createdAt as string) })) });
    if (data.tags?.length) await prisma.tag.createMany({ data: data.tags.map((t: Record<string, unknown>) => ({ ...t, tenantId: tid, createdAt: new Date(t.createdAt as string) })) });
    if (data.transactions?.length) await prisma.transaction.createMany({ data: data.transactions.map((t: Record<string, unknown>) => ({ ...t, tenantId: tid, date: new Date(t.date as string), createdAt: new Date(t.createdAt as string) })) });
    if (data.transactionTags?.length) await prisma.transactionTag.createMany({ data: data.transactionTags });
    if (data.transfers?.length) await prisma.transfer.createMany({ data: data.transfers.map((t: Record<string, unknown>) => ({ ...t, tenantId: tid, date: new Date(t.date as string), createdAt: new Date(t.createdAt as string) })) });
    if (data.budgets?.length) await prisma.budget.createMany({ data: data.budgets.map((b: Record<string, unknown>) => ({ ...b, tenantId: tid, createdAt: new Date(b.createdAt as string) })) });
    if (data.recurring?.length) await prisma.recurring.createMany({ data: data.recurring.map((r: Record<string, unknown>) => ({ ...r, tenantId: tid, createdAt: new Date(r.createdAt as string) })) });
    if (data.installments?.length) await prisma.installment.createMany({ data: data.installments.map((i: Record<string, unknown>) => ({ ...i, tenantId: tid, startDate: new Date(i.startDate as string), createdAt: new Date(i.createdAt as string) })) });
    if (data.savingsGoals?.length) await prisma.savingsGoal.createMany({ data: data.savingsGoals.map((g: Record<string, unknown>) => ({ ...g, tenantId: tid, deadline: g.deadline ? new Date(g.deadline as string) : null, createdAt: new Date(g.createdAt as string) })) });
    if (data.notifications?.length) await prisma.notification.createMany({ data: data.notifications.map((n: Record<string, unknown>) => ({ ...n, tenantId: tid, createdAt: new Date(n.createdAt as string) })) });
    if (data.balanceHistory?.length) await prisma.balanceHistory.createMany({ data: data.balanceHistory.map((b: Record<string, unknown>) => ({ ...b, tenantId: tid, date: new Date(b.date as string), createdAt: new Date(b.createdAt as string) })) });
    if (data.plannings?.length) await prisma.planning.createMany({ data: data.plannings.map((p: Record<string, unknown>) => ({ ...p, tenantId: tid, createdAt: new Date(p.createdAt as string) })) });
    if (data.payables?.length) await prisma.payable.createMany({ data: data.payables.map((p: Record<string, unknown>) => ({ ...p, tenantId: tid, dueDate: new Date(p.dueDate as string), paidDate: p.paidDate ? new Date(p.paidDate as string) : null, createdAt: new Date(p.createdAt as string) })) });

    return NextResponse.json({ ok: true, message: "Dados restaurados com sucesso" });
  } catch (err) {
    return NextResponse.json({ error: "Falha ao restaurar: " + (err as Error).message }, { status: 500 });
  }
}
