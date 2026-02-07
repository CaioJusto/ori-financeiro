import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { readFile, unlink } from "fs/promises";
import path from "path";
import { requirePermission } from "@/lib/tenant";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenant } = await requirePermission("attachments:read");
  if (error) return error;
  const { id } = await params;
  const attachment = await prisma.attachment.findUnique({ where: { id, tenantId: tenant.tenantId } });
  if (!attachment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const filePath = path.join(UPLOAD_DIR, attachment.path);
  try {
    const buffer = await readFile(filePath);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": attachment.mimeType,
        "Content-Disposition": `inline; filename="${attachment.filename}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenant } = await requirePermission("attachments:write");
  if (error) return error;
  const { id } = await params;
  const attachment = await prisma.attachment.findUnique({ where: { id, tenantId: tenant.tenantId } });
  if (!attachment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try { await unlink(path.join(UPLOAD_DIR, attachment.path)); } catch { /* file may not exist */ }
  await prisma.attachment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
