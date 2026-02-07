import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenant } = await requirePermission("installments:write");
  if (error) return error;
  const { id } = await params;
  await prisma.installment.delete({ where: { id, tenantId: tenant.tenantId } });
  return NextResponse.json({ ok: true });
}
