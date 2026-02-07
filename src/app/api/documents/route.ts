import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  const { error, tenant } = await requirePermission("attachments.view");
  if (error) return error;

  const search = req.nextUrl.searchParams.get("search");
  const tag = req.nextUrl.searchParams.get("tag");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { tenantId: tenant.tenantId };
  if (search) where.name = { contains: search, mode: "insensitive" };
  if (tag) where.tags = { contains: tag };

  const docs = await prisma.document.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(docs);
}

export async function POST(req: NextRequest) {
  const { error, tenant } = await requirePermission("attachments.create");
  if (error) return error;

  const body = await req.json();
  const { name, type, size, path, transactionId, invoiceId, contactId, tags } = body;

  if (!name || !path) return NextResponse.json({ error: "Name and path required" }, { status: 400 });

  const doc = await prisma.document.create({
    data: {
      name, type: type || "file", size: size || 0, path,
      transactionId, invoiceId, contactId,
      tags: JSON.stringify(tags || []),
      uploadedBy: tenant.userId,
      tenantId: tenant.tenantId,
    },
  });

  return NextResponse.json(doc, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { error, tenant } = await requirePermission("attachments.delete");
  if (error) return error;

  const { id } = await req.json();
  await prisma.document.deleteMany({ where: { id, tenantId: tenant.tenantId } });
  return NextResponse.json({ ok: true });
}
