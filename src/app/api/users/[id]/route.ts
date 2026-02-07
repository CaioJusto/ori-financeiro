import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenant } = await requirePermission("users.edit");
  if (error) return error;
  const { id } = await params;
  const body = await req.json();

  const data: Record<string, unknown> = {};
  if (body.name) data.name = body.name;
  if (body.roleId) {
    // Validate role belongs to tenant
    const role = await prisma.customRole.findFirst({
      where: { id: body.roleId, tenantId: tenant.tenantId },
    });
    if (!role) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    data.roleId = body.roleId;
  }

  const user = await prisma.user.update({
    where: { id, tenantId: tenant.tenantId },
    data,
    select: { id: true, email: true, name: true, roleId: true, role: { select: { id: true, name: true } }, createdAt: true },
  });
  return NextResponse.json(user);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenant } = await requirePermission("users.remove");
  if (error) return error;
  const { id } = await params;

  if (id === tenant.userId) {
    return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
  }

  await prisma.user.delete({ where: { id, tenantId: tenant.tenantId } });
  return NextResponse.json({ ok: true });
}
