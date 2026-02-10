import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";
import { encrypt, decrypt } from "@/lib/encryption";

function maskApiKey(key: string | null): string {
  if (!key) return "";
  try {
    const decrypted = decrypt(key);
    if (decrypted.length <= 8) return "sk-...";
    return decrypted.slice(0, 5) + "..." + decrypted.slice(-4);
  } catch {
    return "sk-...****";
  }
}

export async function GET() {
  const { error, tenant } = await requirePermission("settings:read");
  if (error) return error;

  let settings = await prisma.tenantSettings.findUnique({
    where: { tenantId: tenant.tenantId },
  });

  if (!settings) {
    settings = await prisma.tenantSettings.create({
      data: { tenantId: tenant.tenantId },
    });
  }

  return NextResponse.json({
    aiApiKey: maskApiKey(settings.aiApiKey),
    aiApiKeySet: !!settings.aiApiKey,
    aiModel: settings.aiModel,
    aiEnabled: settings.aiEnabled,
    aiSystemPrompt: settings.aiSystemPrompt,
  });
}

export async function POST(req: NextRequest) {
  const { error, tenant } = await requirePermission("settings:write");
  if (error) return error;

  const body = await req.json();
  const { aiApiKey, aiModel, aiEnabled, aiSystemPrompt } = body;

  const updateData: any = {};

  if (aiApiKey !== undefined && aiApiKey !== null && aiApiKey !== "") {
    updateData.aiApiKey = encrypt(aiApiKey);
  } else if (aiApiKey === "") {
    updateData.aiApiKey = null;
  }

  if (aiModel !== undefined) updateData.aiModel = aiModel;
  if (aiEnabled !== undefined) updateData.aiEnabled = aiEnabled;
  if (aiSystemPrompt !== undefined) updateData.aiSystemPrompt = aiSystemPrompt || null;

  const settings = await prisma.tenantSettings.upsert({
    where: { tenantId: tenant.tenantId },
    create: { tenantId: tenant.tenantId, ...updateData },
    update: updateData,
  });

  return NextResponse.json({
    aiApiKey: maskApiKey(settings.aiApiKey),
    aiApiKeySet: !!settings.aiApiKey,
    aiModel: settings.aiModel,
    aiEnabled: settings.aiEnabled,
    aiSystemPrompt: settings.aiSystemPrompt,
  });
}
