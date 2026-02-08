import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenant } = await requirePermission("transactions:read");
  if (error) return error;

  const { id } = await params;
  const body = await req.json();

  const conv = await prisma.chatConversation.findFirst({
    where: { id, tenantId: tenant.tenantId, userId: tenant.userId },
  });
  if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (body.title !== undefined) data.title = body.title;
  if (body.pinned !== undefined) data.pinned = body.pinned;

  const updated = await prisma.chatConversation.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenant } = await requirePermission("transactions:read");
  if (error) return error;

  const { id } = await params;
  await prisma.chatConversation.deleteMany({
    where: { id, tenantId: tenant.tenantId, userId: tenant.userId },
  });
  return NextResponse.json({ success: true });
}
