import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  const { error, tenant } = await requirePermission("accounts:read");
  if (error) return error;
  const url = new URL(req.url);
  const accountId = url.searchParams.get("accountId");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { tenantId: tenant.tenantId };
  if (accountId) where.accountId = accountId;
  const recs = await prisma.accountReconciliation.findMany({ where, orderBy: { date: "desc" } });
  return NextResponse.json(recs);
}

export async function POST(req: NextRequest) {
  const { error, tenant } = await requirePermission("accounts:write");
  if (error) return error;
  const body = await req.json();
  const rec = await prisma.accountReconciliation.create({
    data: { accountId: body.accountId, balance: body.balance, date: new Date(body.date), locked: true, tenantId: tenant.tenantId },
  });
  return NextResponse.json(rec);
}
