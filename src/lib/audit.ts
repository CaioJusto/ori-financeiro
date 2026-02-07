import { prisma } from "@/lib/prisma";

export async function logAudit(action: string, entity: string, entityId: string, changes: Record<string, unknown> = {}, tenantId?: string) {
  try {
    if (!tenantId) return;
    await prisma.auditLog.create({
      data: { action, entity, entityId, changes: JSON.stringify(changes), tenantId },
    });
  } catch (e) {
    console.error("Audit log error:", e);
  }
}
