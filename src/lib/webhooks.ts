import { prisma } from "@/lib/prisma";
import { createHmac } from "crypto";

export async function fireWebhooks(tenantId: string, event: string, payload: Record<string, unknown>) {
  const webhooks = await prisma.webhook.findMany({
    where: { tenantId, active: true },
  });

  for (const wh of webhooks) {
    const events = wh.events as string[];
    if (!events.includes(event)) continue;

    const body = JSON.stringify({ event, data: payload, timestamp: new Date().toISOString() });
    const signature = createHmac("sha256", wh.secret).update(body).digest("hex");

    try {
      await fetch(wh.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Signature": signature,
          "X-Webhook-Event": event,
        },
        body,
        signal: AbortSignal.timeout(10000),
      });
      await prisma.webhook.update({ where: { id: wh.id }, data: { lastTriggered: new Date() } });
    } catch {
      // Silently fail - webhook delivery is best-effort
    }
  }
}
