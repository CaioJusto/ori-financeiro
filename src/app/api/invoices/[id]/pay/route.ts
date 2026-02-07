import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenant } = await requirePermission("invoices:write");
  if (error) return error;
  const { id } = await params;
  const body = await req.json();
  const invoice = await prisma.invoice.findFirst({ where: { id, tenantId: tenant.tenantId } });
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Mark as paid
  await prisma.invoice.update({ where: { id }, data: { status: "PAID", paidDate: new Date() } });

  // Auto-create income transaction if accountId and categoryId provided
  if (body.accountId && body.categoryId) {
    await prisma.transaction.create({
      data: {
        description: `Fatura ${invoice.number} - ${invoice.clientName}`,
        amount: invoice.total,
        type: "income",
        date: new Date(),
        accountId: body.accountId,
        categoryId: body.categoryId,
        tenantId: tenant.tenantId,
      },
    });
  }

  return NextResponse.json({ ok: true });
}
