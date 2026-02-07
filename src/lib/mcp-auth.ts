import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export async function authenticateMcpRequest(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { error: "Missing or invalid Authorization header", status: 401 };
  }

  const rawKey = authHeader.slice(7);
  const keyHash = createHash("sha256").update(rawKey).digest("hex");
  const keyPrefix = rawKey.slice(0, 12);

  const apiKey = await prisma.apiKey.findFirst({
    where: { keyPrefix, keyHash, active: true },
  });

  if (!apiKey) {
    return { error: "Invalid API key", status: 401 };
  }

  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    return { error: "API key expired", status: 401 };
  }

  // Rate limiting: 100 req/min per key
  const now = Date.now();
  const rl = rateLimitMap.get(apiKey.id);
  if (rl && rl.resetAt > now) {
    if (rl.count >= 100) {
      return { error: "Rate limit exceeded (100 req/min)", status: 429 };
    }
    rl.count++;
  } else {
    rateLimitMap.set(apiKey.id, { count: 1, resetAt: now + 60000 });
  }

  // Update lastUsed
  await prisma.apiKey.update({ where: { id: apiKey.id }, data: { lastUsed: new Date() } });

  return { tenantId: apiKey.tenantId, apiKeyId: apiKey.id };
}
