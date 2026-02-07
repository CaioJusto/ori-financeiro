import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function GET() {
  const { error, tenant } = await requirePermission("settings.view");
  if (error) return error;

  const providers = await prisma.openFinanceProvider.findMany({
    where: { tenantId: tenant.tenantId },
    include: { connections: true },
    orderBy: { createdAt: "desc" },
  });

  // Mask secrets
  const masked = providers.map(p => ({
    ...p,
    clientSecret: p.clientSecret ? "••••••••" : "",
    accessToken: p.accessToken ? "••••••••" : null,
    refreshToken: undefined,
  }));

  return NextResponse.json(masked);
}

export async function POST(req: NextRequest) {
  const { error, tenant } = await requirePermission("settings.edit");
  if (error) return error;

  const body = await req.json();
  const { provider, clientId, clientSecret } = body;

  if (!provider || !["PLUGGY", "BELVO"].includes(provider)) {
    return NextResponse.json({ error: "Provider must be PLUGGY or BELVO" }, { status: 400 });
  }

  const existing = await prisma.openFinanceProvider.findFirst({
    where: { tenantId: tenant.tenantId, provider },
  });

  if (existing) {
    const updated = await prisma.openFinanceProvider.update({
      where: { id: existing.id },
      data: { clientId: clientId || "", clientSecret: clientSecret || "", active: true },
    });
    return NextResponse.json(updated);
  }

  const created = await prisma.openFinanceProvider.create({
    data: {
      tenantId: tenant.tenantId,
      provider,
      clientId: clientId || "",
      clientSecret: clientSecret || "",
    },
  });

  return NextResponse.json(created);
}
