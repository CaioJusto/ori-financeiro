import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function GET() {
  const { error, tenant } = await requirePermission("accounts:read");
  if (error) return error;

  const accounts = await prisma.account.findMany({
    where: { tenantId: tenant.tenantId },
    include: {
      transactions: true,
      transfersFrom: true,
      transfersTo: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const result = accounts.map((a) => {
    const income = a.transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = a.transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const transferIn = a.transfersTo.reduce((s, t) => s + t.amount, 0);
    const transferOut = a.transfersFrom.reduce((s, t) => s + t.amount, 0);
    return { ...a, balance: income - expense + transferIn - transferOut, transactions: undefined, transfersFrom: undefined, transfersTo: undefined };
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const { error, tenant } = await requirePermission("accounts:write");
  if (error) return error;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request body is required" }, { status: 400 });
  }
  if (!body.name || typeof body.name !== "string" || body.name.trim() === "") {
    return NextResponse.json({ error: "Field 'name' is required" }, { status: 400 });
  }
  const account = await prisma.account.create({ data: { name: body.name as string, type: (body.type as string) || "personal", color: (body.color as string) || "#3b82f6", currency: (body.currency as string) || "BRL", tenantId: tenant.tenantId } });
  await logAudit("create", "account", account.id, { name: body.name }, tenant.tenantId);
  return NextResponse.json(account);
}
