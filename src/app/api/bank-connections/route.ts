import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

const BANKS = [
  { name: "Banco do Brasil", logo: "🏦" },
  { name: "Itaú", logo: "🧡" },
  { name: "Bradesco", logo: "❤️" },
  { name: "Nubank", logo: "💜" },
  { name: "Inter", logo: "🟠" },
  { name: "Caixa", logo: "💙" },
  { name: "Santander", logo: "🔴" },
  { name: "C6 Bank", logo: "⚫" },
];

export async function GET() {
  const { error, tenant } = await requirePermission("settings.view");
  if (error) return error;

  const connections = await prisma.bankConnection.findMany({
    where: { tenantId: tenant.tenantId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ connections, availableBanks: BANKS });
}

export async function POST(req: NextRequest) {
  const { error, tenant } = await requirePermission("settings.edit");
  if (error) return error;

  const { bankName, accountId } = await req.json();
  const bank = BANKS.find((b) => b.name === bankName);
  if (!bank) return NextResponse.json({ error: "Bank not found" }, { status: 400 });

  const connection = await prisma.bankConnection.create({
    data: {
      tenantId: tenant.tenantId,
      bankName: bank.name,
      bankLogo: bank.logo,
      status: "CONNECTED",
      lastSync: new Date(),
      accountId: accountId || null,
    },
  });

  // Simulate importing some transactions
  if (accountId) {
    const categories = await prisma.category.findMany({ where: { tenantId: tenant.tenantId }, take: 5 });
    if (categories.length > 0) {
      const descriptions = ["Supermercado", "Posto de gasolina", "Restaurante", "Farmácia", "Transferência recebida"];
      const types = ["expense", "expense", "expense", "expense", "income"];
      const amounts = [234.56, 150.00, 89.90, 45.50, 3500.00];

      for (let i = 0; i < 5; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        await prisma.transaction.create({
          data: {
            description: `[${bank.name}] ${descriptions[i]}`,
            amount: amounts[i],
            type: types[i],
            date,
            accountId,
            categoryId: categories[i % categories.length].id,
            tenantId: tenant.tenantId,
          },
        });
      }
    }
  }

  return NextResponse.json(connection, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { error, tenant } = await requirePermission("settings.edit");
  if (error) return error;

  const { id } = await req.json();
  await prisma.bankConnection.deleteMany({ where: { id, tenantId: tenant.tenantId } });
  return NextResponse.json({ ok: true });
}
