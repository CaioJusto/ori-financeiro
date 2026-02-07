import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function POST(req: NextRequest) {
  const { error, tenant } = await requirePermission("settings.edit");
  if (error) return error;

  const { id } = await req.json();
  const connection = await prisma.bankConnection.findFirst({
    where: { id, tenantId: tenant.tenantId },
  });
  if (!connection) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Simulate sync - add a few random transactions
  if (connection.accountId) {
    const categories = await prisma.category.findMany({ where: { tenantId: tenant.tenantId }, take: 3 });
    if (categories.length > 0) {
      const descs = ["PIX recebido", "Débito automático", "Compra online"];
      for (let i = 0; i < 2; i++) {
        await prisma.transaction.create({
          data: {
            description: `[${connection.bankName}] ${descs[i % descs.length]}`,
            amount: Math.round(Math.random() * 500 * 100) / 100,
            type: i === 0 ? "income" : "expense",
            date: new Date(),
            accountId: connection.accountId,
            categoryId: categories[i % categories.length].id,
            tenantId: tenant.tenantId,
          },
        });
      }
    }
  }

  await prisma.bankConnection.update({
    where: { id },
    data: { lastSync: new Date(), status: "CONNECTED" },
  });

  return NextResponse.json({ ok: true, lastSync: new Date() });
}
