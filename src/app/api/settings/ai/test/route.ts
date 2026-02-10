import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";
import { decrypt } from "@/lib/encryption";

export async function POST(req: NextRequest) {
  const { error, tenant } = await requirePermission("settings:write");
  if (error) return error;

  const body = await req.json();
  let apiKey = body.apiKey;

  // If no key provided, use the saved one
  if (!apiKey) {
    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId: tenant.tenantId },
    });
    if (!settings?.aiApiKey) {
      return NextResponse.json({ success: false, error: "Nenhuma API Key configurada" }, { status: 400 });
    }
    try {
      apiKey = decrypt(settings.aiApiKey);
    } catch {
      return NextResponse.json({ success: false, error: "Erro ao descriptografar a API Key" }, { status: 500 });
    }
  }

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: "Diga apenas: OK" }],
        max_tokens: 5,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const msg = data?.error?.message || `Erro HTTP ${res.status}`;
      return NextResponse.json({ success: false, error: msg }, { status: 400 });
    }

    const data = await res.json();
    return NextResponse.json({
      success: true,
      message: "Conexão com OpenAI bem-sucedida!",
      model: data.model,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Erro de conexão" }, { status: 500 });
  }
}
