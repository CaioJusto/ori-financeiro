import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  const { error, tenant } = await requirePermission("investments:read");
  if (error) return error;
  const investments = await prisma.investment.findMany({ where: { tenantId: tenant.tenantId }, orderBy: { name: "asc" } });
  return NextResponse.json(investments);
}

export async function POST(req: NextRequest) {
  const { error, tenant } = await requirePermission("investments:write");
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
  const quantity = parseFloat(body.quantity) || 0;
  const avgPrice = parseFloat(body.avgPrice) || 0;
  const currentPrice = parseFloat(body.currentPrice) || avgPrice;
  const totalInvested = quantity * avgPrice;
  const currentValue = quantity * currentPrice;
  const investment = await prisma.investment.create({
    data: {
      type: body.type || "OTHER",
      ticker: body.ticker || null,
      name: body.name,
      quantity,
      avgPrice,
      currentPrice,
      totalInvested,
      currentValue,
      profitLoss: currentValue - totalInvested,
      tenantId: tenant.tenantId,
    },
  });
  return NextResponse.json(investment);
}
