import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenant } = await requirePermission("payables:write");
  if (error) return error;
  const { id } = await params;
  const body = await req.json();
  const payable = await prisma.payable.findUnique({ where: { id, tenantId: tenant.tenantId } });
  if (!payable) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.payable.update({
    where: { id },
    data: { paid: true, paidDate: new Date(), accountId: body.accountId || payable.accountId },
  });

  const accountId = body.accountId || payable.accountId;
  const categoryId = payable.categoryId;
  if (accountId && categoryId) {
    await prisma.transaction.create({
      data: {
        description: payable.description,
        amount: payable.amount,
        type: payable.type === "payable" ? "expense" : "income",
        date: new Date(),
        accountId,
        categoryId,
        tenantId: tenant.tenantId,
      },
    });
  }

  return NextResponse.json(updated);
}
