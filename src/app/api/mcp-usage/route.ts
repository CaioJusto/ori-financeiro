import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function GET() {
  const { error, tenant } = await requirePermission("settings.view");
  if (error) return error;

  const [logs, totalCalls, toolBreakdown] = await Promise.all([
    prisma.mcpUsageLog.findMany({
      where: { tenantId: tenant.tenantId },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { apiKey: { select: { name: true, keyPrefix: true } } },
    }),
    prisma.mcpUsageLog.count({ where: { tenantId: tenant.tenantId } }),
    prisma.mcpUsageLog.groupBy({
      by: ["tool"],
      where: { tenantId: tenant.tenantId },
      _count: true,
      _avg: { responseTime: true },
    }),
  ]);

  return NextResponse.json({
    totalCalls,
    recentLogs: logs,
    toolBreakdown: toolBreakdown.map((t) => ({
      tool: t.tool,
      count: t._count,
      avgResponseTime: Math.round(t._avg.responseTime || 0),
    })),
  });
}
