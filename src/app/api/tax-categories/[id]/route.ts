import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenant } = await requirePermission("reports:read");
  if (error) return error;
  const { id } = await params;
  const body = await req.json();
  const cat = await prisma.taxCategory.update({ where: { id }, data: { name: body.name, type: body.type, description: body.description || "" } });
  return NextResponse.json(cat);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenant } = await requirePermission("reports:read");
  if (error) return error;
  const { id } = await params;
  await prisma.taxCategory.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
