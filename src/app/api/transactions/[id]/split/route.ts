import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenant } = await requirePermission("transactions:read");
  if (error) return error;
  const { id } = await params;
  const splits = await prisma.transactionSplit.findMany({
    where: { transactionId: id, tenantId: tenant.tenantId },
  });
  return NextResponse.json(splits);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenant } = await requirePermission("transactions:write");
  if (error) return error;
  const { id } = await params;
  const { splits } = await req.json();

  await prisma.transactionSplit.deleteMany({ where: { transactionId: id, tenantId: tenant.tenantId } });

  const created = await prisma.$transaction(
    splits.map((s: { categoryId: string; amount: number; description?: string }) =>
      prisma.transactionSplit.create({
        data: {
          transactionId: id,
          categoryId: s.categoryId,
          amount: s.amount,
          description: s.description || null,
          tenantId: tenant.tenantId,
        },
      })
    )
  );

  return NextResponse.json(created);
}
