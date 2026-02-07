import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";
import { generateMockTransactions } from "@/lib/open-finance-mock";

export async function POST(req: NextRequest) {
  const { error, tenant } = await requirePermission("transactions.create");
  if (error) return error;

  const body = await req.json();
  const { connectionId } = body;

  if (!connectionId) {
    return NextResponse.json({ error: "connectionId required" }, { status: 400 });
  }

  const connection = await prisma.openFinanceConnection.findFirst({
    where: { id: connectionId, tenantId: tenant.tenantId },
  });

  if (!connection) {
    return NextResponse.json({ error: "Connection not found" }, { status: 404 });
  }

  const metadata = connection.metadata as Record<string, unknown>;
  const institutionId = (metadata?.institutionId as string) || "nubank";

  // Generate mock transactions
  const mockTxs = generateMockTransactions(institutionId, 8 + Math.floor(Math.random() * 7));

  // Find default account and category
  const account = connection.accountId
    ? await prisma.account.findFirst({ where: { id: connection.accountId, tenantId: tenant.tenantId } })
    : await prisma.account.findFirst({ where: { tenantId: tenant.tenantId } });

  if (!account) {
    return NextResponse.json({ error: "No account found to sync into" }, { status: 400 });
  }

  const defaultCategory = await prisma.category.findFirst({
    where: { tenantId: tenant.tenantId },
  });

  if (!defaultCategory) {
    return NextResponse.json({ error: "No category found" }, { status: 400 });
  }

  let imported = 0;
  for (const tx of mockTxs) {
    await prisma.transaction.create({
      data: {
        description: `[${connection.institutionName}] ${tx.description}`,
        amount: tx.amount,
        type: tx.type,
        date: new Date(tx.date),
        accountId: account.id,
        categoryId: defaultCategory.id,
        tenantId: tenant.tenantId,
      },
    });
    imported++;
  }

  // Update last sync
  await prisma.openFinanceConnection.update({
    where: { id: connectionId },
    data: { lastSync: new Date() },
  });

  return NextResponse.json({ imported, total: mockTxs.length, connectionId });
}
