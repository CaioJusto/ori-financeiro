import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";
import { MOCK_INSTITUTIONS } from "@/lib/open-finance-mock";

export async function POST(req: NextRequest) {
  const { error, tenant } = await requirePermission("settings.edit");
  if (error) return error;

  const body = await req.json();
  const { providerId, institutionId } = body;

  if (!providerId || !institutionId) {
    return NextResponse.json({ error: "providerId and institutionId required" }, { status: 400 });
  }

  const provider = await prisma.openFinanceProvider.findFirst({
    where: { id: providerId, tenantId: tenant.tenantId },
  });

  if (!provider) {
    return NextResponse.json({ error: "Provider not found" }, { status: 404 });
  }

  const institution = MOCK_INSTITUTIONS.find(i => i.id === institutionId);
  if (!institution) {
    return NextResponse.json({ error: "Institution not found" }, { status: 404 });
  }

  // Simulate connection - in production this would redirect to bank's OAuth
  const connection = await prisma.openFinanceConnection.create({
    data: {
      tenantId: tenant.tenantId,
      providerId: provider.id,
      externalId: `sim_${institutionId}_${Date.now()}`,
      institutionName: institution.name,
      institutionLogo: institution.logo,
      status: "CONNECTED",
      consentId: `consent_${Date.now()}`,
      lastSync: new Date(),
      metadata: { institutionId, type: institution.type, color: institution.color, simulated: true },
    },
  });

  return NextResponse.json(connection);
}
