import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenant } = await requirePermission("installments:write");
  if (error) return error;
  const { id } = await params;
  const inst = await prisma.installment.findUnique({ where: { id, tenantId: tenant.tenantId } });
  if (!inst) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (inst.paidInstallments >= inst.installments) return NextResponse.json({ error: "All installments paid" }, { status: 400 });

  const [updated] = await prisma.$transaction([
    prisma.installment.update({ where: { id }, data: { paidInstallments: { increment: 1 } } }),
    prisma.transaction.create({
      data: {
        description: `[Parcela ${inst.paidInstallments + 1}/${inst.installments}] ${inst.description}`,
        amount: inst.amountPerInstallment, type: "expense",
        date: new Date(), accountId: inst.accountId, categoryId: inst.categoryId,
        notes: `Parcela automática`,
        tenantId: tenant.tenantId,
      },
    }),
  ]);
  return NextResponse.json(updated);
}
