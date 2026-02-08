import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  const { error, tenant } = await requirePermission("subscriptions:read");
  if (error) return error;
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { tenantId: tenant.tenantId };
  if (status && status !== "all") where.status = status;
  const subscriptions = await prisma.subscription.findMany({ where, orderBy: { nextBillingDate: "asc" } });
  return NextResponse.json(subscriptions);
}

export async function POST(req: NextRequest) {
  const { error, tenant } = await requirePermission("subscriptions:write");
  if (error) return error;
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request body is required" }, { status: 400 });
  }
  if (!body || Object.keys(body).length === 0) {
    return NextResponse.json({ error: "Request body is required" }, { status: 400 });
  }
  const subscription = await prisma.subscription.create({
    data: {
      name: body.name,
      provider: body.provider || "",
      amount: parseFloat(body.amount),
      currency: body.currency || "BRL",
      billingCycle: body.billingCycle || "MONTHLY",
      nextBillingDate: body.nextBillingDate ? new Date(body.nextBillingDate) : new Date(),
      category: body.category || "",
      status: body.status || "ACTIVE",
      startDate: body.startDate ? new Date(body.startDate) : new Date(),
      logoUrl: body.logoUrl || null,
      notes: body.notes || null,
      tenantId: tenant.tenantId,
    },
  });
  return NextResponse.json(subscription);
}
