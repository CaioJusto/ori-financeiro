import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function GET() {
  const { error, tenant } = await requirePermission("transactions:read");
  if (error) return error;
  const bills = await prisma.transaction.findMany({
    where: { tenantId: tenant.tenantId, type: "expense" },
    include: { account: true, category: true },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(bills);
}
