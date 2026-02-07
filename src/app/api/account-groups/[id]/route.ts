import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenant } = await requirePermission("accounts:write");
  if (error) return error;
  const { id } = await params;
  const body = await req.json();
  const group = await prisma.accountGroup.update({
    where: { id, tenantId: tenant.tenantId },
    data: { name: body.name, color: body.color, order: body.order },
  });
  return NextResponse.json(group);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenant } = await requirePermission("accounts:write");
  if (error) return error;
  const { id } = await params;
  await prisma.accountGroup.delete({ where: { id, tenantId: tenant.tenantId } });
  return NextResponse.json({ ok: true });
}
