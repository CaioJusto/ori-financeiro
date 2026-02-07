import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function POST(req: NextRequest) {
  const { error, tenant } = await requirePermission("transactions:write");
  if (error) return error;
  const body = await req.json();
  
  if (body.action === "archive") {
    const before = new Date(body.before);
    const result = await prisma.transaction.updateMany({
      where: { tenantId: tenant.tenantId, date: { lt: before }, archived: false },
      data: { archived: true },
    });
    return NextResponse.json({ archived: result.count });
  }
  
  if (body.action === "unarchive") {
    const result = await prisma.transaction.updateMany({
      where: { tenantId: tenant.tenantId, archived: true },
      data: { archived: false },
    });
    return NextResponse.json({ unarchived: result.count });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
