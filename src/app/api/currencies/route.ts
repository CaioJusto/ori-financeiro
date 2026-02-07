import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function GET() {
  const { error, tenant } = await requirePermission("settings.view");
  if (error) return error;

  const rates = await prisma.currencyRate.findMany({
    where: { tenantId: tenant.tenantId },
    orderBy: { fromCurrency: "asc" },
  });

  return NextResponse.json(rates);
}

export async function POST(req: NextRequest) {
  const { error, tenant } = await requirePermission("settings.edit");
  if (error) return error;

  const { fromCurrency, toCurrency, rate } = await req.json();
  if (!fromCurrency || !toCurrency || !rate) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const existing = await prisma.currencyRate.findUnique({
    where: { tenantId_fromCurrency_toCurrency: { tenantId: tenant.tenantId, fromCurrency, toCurrency } },
  });

  if (existing) {
    const updated = await prisma.currencyRate.update({
      where: { id: existing.id },
      data: { rate, date: new Date() },
    });
    return NextResponse.json(updated);
  }

  const created = await prisma.currencyRate.create({
    data: { fromCurrency, toCurrency, rate, tenantId: tenant.tenantId },
  });

  return NextResponse.json(created, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { error, tenant } = await requirePermission("settings.edit");
  if (error) return error;

  const { id } = await req.json();
  await prisma.currencyRate.deleteMany({ where: { id, tenantId: tenant.tenantId } });
  return NextResponse.json({ ok: true });
}
