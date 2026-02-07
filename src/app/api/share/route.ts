import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { requirePermission } from "@/lib/tenant";

export async function POST(req: NextRequest) {
  const { error, tenant } = await requirePermission("share:write");
  if (error) return error;

  const body = await req.json();
  const token = randomBytes(16).toString("hex");
  const expiresAt = new Date(Date.now() + (body.expiresInDays || 7) * 86400000);
  const report = await prisma.sharedReport.create({
    data: {
      token, reportType: body.reportType,
      filters: JSON.stringify(body.filters || {}),
      expiresAt, tenantId: tenant.tenantId,
    },
  });
  return NextResponse.json({ ...report, token, url: `/shared/${token}` }, { status: 201 });
}
