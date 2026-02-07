import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  const { error, tenant } = await requirePermission("activity:read");
  if (error) return error;
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "30");

  const logs = await prisma.auditLog.findMany({
    where: { tenantId: tenant.tenantId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  const items = logs.map((l) => {
    const changes = JSON.parse(l.changes);
    return { id: l.id, action: l.action, entity: l.entity, entityId: l.entityId, changes, createdAt: l.createdAt };
  });

  return NextResponse.json(items);
}
