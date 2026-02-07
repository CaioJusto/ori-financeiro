import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function POST() {
  const { error, tenant } = await requirePermission("recurring:write");
  if (error) return error;

  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const recurring = await prisma.recurring.findMany({ where: { active: true, tenantId: tenant.tenantId } });

  let created = 0;
  for (const r of recurring) {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const existing = await prisma.transaction.findFirst({
      where: {
        description: { contains: `[Rec] ${r.description}` },
        date: { gte: startOfMonth, lte: endOfMonth },
        accountId: r.accountId,
        tenantId: tenant.tenantId,
      },
    });
    if (existing) continue;

    if (r.frequency === "monthly" || r.frequency === "yearly" && now.getMonth() === 0 || r.frequency === "weekly") {
      const day = Math.min(r.dayOfMonth, new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate());
      await prisma.transaction.create({
        data: {
          description: `[Rec] ${r.description}`,
          amount: r.amount, type: r.type,
          date: new Date(now.getFullYear(), now.getMonth(), day),
          accountId: r.accountId, categoryId: r.categoryId,
          notes: `Recorrência automática - ${month}`,
          tenantId: tenant.tenantId,
        },
      });
      created++;
    }
  }
  return NextResponse.json({ created });
}
