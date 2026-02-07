import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  const { error, tenant } = await requirePermission("transactions:read");
  if (error) return error;
  const url = new URL(req.url);
  const transactionId = url.searchParams.get("transactionId");
  if (!transactionId) return NextResponse.json([]);

  const logs = await prisma.transactionLog.findMany({
    where: { transactionId, tenantId: tenant.tenantId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(logs);
}
