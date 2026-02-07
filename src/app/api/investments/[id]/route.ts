import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenant } = await requirePermission("investments:write");
  if (error) return error;
  const { id } = await params;
  const body = await req.json();
  const quantity = parseFloat(body.quantity) || 0;
  const avgPrice = parseFloat(body.avgPrice) || 0;
  const currentPrice = parseFloat(body.currentPrice) || avgPrice;
  const totalInvested = quantity * avgPrice;
  const currentValue = quantity * currentPrice;
  const investment = await prisma.investment.update({
    where: { id },
    data: {
      type: body.type,
      ticker: body.ticker || null,
      name: body.name,
      quantity,
      avgPrice,
      currentPrice,
      totalInvested,
      currentValue,
      profitLoss: currentValue - totalInvested,
      lastUpdate: new Date(),
    },
  });
  return NextResponse.json(investment);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenant } = await requirePermission("investments:write");
  if (error) return error;
  const { id } = await params;
  await prisma.investment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
