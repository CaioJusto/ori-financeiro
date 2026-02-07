import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function GET() {
  const { error, tenant } = await requirePermission("installments:read");
  if (error) return error;
  const items = await prisma.installment.findMany({ where: { tenantId: tenant.tenantId }, include: { account: true, category: true }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const { error, tenant } = await requirePermission("installments:write");
  if (error) return error;
  const body = await req.json();
  const totalAmount = parseFloat(body.totalAmount);
  const installments = parseInt(body.installments);
  const item = await prisma.installment.create({
    data: {
      description: body.description, totalAmount, installments,
      amountPerInstallment: totalAmount / installments,
      accountId: body.accountId, categoryId: body.categoryId,
      startDate: new Date(body.startDate),
      tenantId: tenant.tenantId,
    },
    include: { account: true, category: true },
  });
  return NextResponse.json(item);
}
