import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";
import { ALL_PERMISSIONS } from "@/lib/permissions";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenant } = await requirePermission("users.view");
  if (error) return error;
  const { id } = await params;

  const role = await prisma.customRole.findFirst({
    where: { id, tenantId: tenant.tenantId },
    include: { _count: { select: { users: true } } },
  });

  if (!role) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(role);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenant } = await requirePermission("users.change_role");
  if (error) return error;
  const { id } = await params;
  const body = await req.json();

  const role = await prisma.customRole.findFirst({
    where: { id, tenantId: tenant.tenantId },
  });
  if (!role) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (role.isSystem) return NextResponse.json({ error: "Cannot edit system roles" }, { status: 403 });

  const data: Record<string, unknown> = {};
  if (body.name) data.name = body.name;
  if (body.description !== undefined) data.description = body.description;
  if (body.permissions && Array.isArray(body.permissions)) {
    const valid = body.permissions.every((p: string) => (ALL_PERMISSIONS as readonly string[]).includes(p));
    if (!valid) return NextResponse.json({ error: "Invalid permissions" }, { status: 400 });
    data.permissions = body.permissions;
  }

  const updated = await prisma.customRole.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenant } = await requirePermission("users.change_role");
  if (error) return error;
  const { id } = await params;

  const role = await prisma.customRole.findFirst({
    where: { id, tenantId: tenant.tenantId },
    include: { _count: { select: { users: true } } },
  });
  if (!role) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (role.isSystem) return NextResponse.json({ error: "Cannot delete system roles" }, { status: 403 });
  if (role._count.users > 0) return NextResponse.json({ error: "Role has users assigned" }, { status: 400 });

  await prisma.customRole.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
