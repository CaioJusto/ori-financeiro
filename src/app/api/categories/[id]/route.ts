import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenant } = await requirePermission("categories:read");
  if (error) return error;
  const { id } = await params;
  const category = await prisma.category.findUnique({ where: { id, tenantId: tenant.tenantId } });
  if (!category) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(category);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenant } = await requirePermission("categories:write");
  if (error) return error;
  const { id } = await params;
  const body = await req.json();
  const cat = await prisma.category.update({ where: { id, tenantId: tenant.tenantId }, data: body });
  return NextResponse.json(cat);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenant } = await requirePermission("categories:write");
  if (error) return error;
  const { id } = await params;
  await prisma.category.delete({ where: { id, tenantId: tenant.tenantId } });
  return NextResponse.json({ ok: true });
}
