import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";

export async function authenticateApiKey(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return { error: NextResponse.json({ error: "Missing API key" }, { status: 401 }), tenantId: null };
  }

  const rawKey = auth.slice(7);
  const keyHash = createHash("sha256").update(rawKey).digest("hex");

  const apiKey = await prisma.apiKey.findFirst({
    where: { keyHash, active: true },
  });

  if (!apiKey) {
    return { error: NextResponse.json({ error: "Invalid API key" }, { status: 401 }), tenantId: null };
  }

  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    return { error: NextResponse.json({ error: "API key expired" }, { status: 401 }), tenantId: null };
  }

  // Update last used
  await prisma.apiKey.update({ where: { id: apiKey.id }, data: { lastUsed: new Date() } });

  return { error: null, tenantId: apiKey.tenantId };
}
