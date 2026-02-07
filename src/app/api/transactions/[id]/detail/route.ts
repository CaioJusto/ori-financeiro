import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenant } = await requirePermission("transactions:read");
  if (error) return error;
  const { id } = await params;

  const transaction = await prisma.transaction.findUnique({
    where: { id, tenantId: tenant.tenantId },
    include: {
      account: true,
      category: true,
      tags: { include: { tag: true } },
      splits: true,
      attachments: true,
      contact: true,
    },
  });

  if (!transaction) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const auditLogs = await prisma.auditLog.findMany({
    where: { entity: "transaction", entityId: id, tenantId: tenant.tenantId },
    orderBy: { createdAt: "desc" },
  });

  const history = auditLogs.map((l) => ({
    id: l.id,
    action: l.action,
    changes: JSON.parse(l.changes),
    createdAt: l.createdAt,
  }));

  return NextResponse.json({ ...transaction, history });
}
