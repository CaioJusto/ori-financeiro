import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenant } = await requirePermission("tags:write");
  if (error) return error;
  const { id } = await params;
  const body = await req.json();
  if (!body || (!body.name && !body.color)) {
    return NextResponse.json({ error: "name or color required" }, { status: 400 });
  }
  const tag = await prisma.tag.update({ where: { id, tenantId: tenant.tenantId }, data: { name: body.name, color: body.color } });
  return NextResponse.json(tag);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenant } = await requirePermission("tags:write");
  if (error) return error;
  const { id } = await params;
  await prisma.tag.delete({ where: { id, tenantId: tenant.tenantId } });
  return NextResponse.json({ ok: true });
}
