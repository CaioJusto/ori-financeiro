import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenant } = await requirePermission("accounts:write");
  if (error) return error;
  const { id } = await params;
  const body = await req.json();
  const account = await prisma.account.update({ where: { id, tenantId: tenant.tenantId }, data: body });
  return NextResponse.json(account);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenant } = await requirePermission("accounts:write");
  if (error) return error;
  const { id } = await params;
  await prisma.account.delete({ where: { id, tenantId: tenant.tenantId } });
  return NextResponse.json({ ok: true });
}
