import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { requirePermission } from "@/lib/tenant";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

export async function POST(req: NextRequest) {
  const { error, tenant } = await requirePermission("attachments:write");
  if (error) return error;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const transactionId = formData.get("transactionId") as string;

  if (!file || !transactionId) {
    return NextResponse.json({ error: "file and transactionId required" }, { status: 400 });
  }

  await mkdir(UPLOAD_DIR, { recursive: true });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const ext = path.extname(file.name) || ".bin";
  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
  const filePath = path.join(UPLOAD_DIR, uniqueName);

  await writeFile(filePath, buffer);

  const attachment = await prisma.attachment.create({
    data: {
      transactionId,
      filename: file.name,
      mimeType: file.type || "application/octet-stream",
      size: buffer.length,
      path: uniqueName,
      tenantId: tenant.tenantId,
    },
  });

  return NextResponse.json(attachment);
}

export async function GET(req: NextRequest) {
  const { error, tenant } = await requirePermission("attachments:read");
  if (error) return error;
  const { searchParams } = new URL(req.url);
  const transactionId = searchParams.get("transactionId");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { tenantId: tenant.tenantId };
  if (transactionId) where.transactionId = transactionId;
  const attachments = await prisma.attachment.findMany({ where, orderBy: { createdAt: "desc" } });
  return NextResponse.json(attachments);
}
