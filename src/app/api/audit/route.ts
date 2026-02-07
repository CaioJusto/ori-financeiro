import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  const { error, tenant } = await requirePermission("audit.view");
  if (error) return error;

  const url = req.nextUrl;
  const entity = url.searchParams.get("entity");
  const action = url.searchParams.get("action");
  const search = url.searchParams.get("search");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const format = url.searchParams.get("format");
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "50");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { tenantId: tenant.tenantId };
  if (entity) where.entity = entity;
  if (action) where.action = action;
  if (search) where.OR = [
    { entity: { contains: search, mode: "insensitive" } },
    { entityId: { contains: search } },
    { userName: { contains: search, mode: "insensitive" } },
    { changes: { contains: search, mode: "insensitive" } },
  ];
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to + "T23:59:59Z");
  }

  if (format === "csv") {
    const logs = await prisma.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, take: 5000 });
    const csv = [
      "Data,Ação,Entidade,ID,Usuário,IP,Alterações",
      ...logs.map(l => `"${new Date(l.createdAt).toISOString()}","${l.action}","${l.entity}","${l.entityId}","${l.userName || ""}","${l.ipAddress || ""}","${l.changes.replace(/"/g, '""')}"`)
    ].join("\n");
    return new NextResponse(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=audit-trail.csv" } });
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit }),
    prisma.auditLog.count({ where }),
  ]);

  return NextResponse.json({ logs, total, page, totalPages: Math.ceil(total / limit) });
}
