import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function POST() {
  const { error, tenant } = await requirePermission("notifications:read");
  if (error) return error;
  await prisma.notification.updateMany({
    where: { tenantId: tenant.tenantId, OR: [{ userId: tenant.userId }, { userId: null }], read: false },
    data: { read: true },
  });
  return NextResponse.json({ ok: true });
}
