import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenant } = await requirePermission("notifications:read");
  if (error) return error;
  const { id } = await params;
  const notification = await prisma.notification.update({
    where: { id, tenantId: tenant.tenantId },
    data: { read: true },
  });
  return NextResponse.json(notification);
}
