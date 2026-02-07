import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenant } = await requirePermission("transactions:write");
  if (error) return error;
  const { id } = await params;
  await prisma.comment.delete({ where: { id, tenantId: tenant.tenantId } });
  return NextResponse.json({ ok: true });
}
