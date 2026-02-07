import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tenantId = (session.user as any).tenantId;
  const reports = await prisma.scheduledReport.findMany({ where: { tenantId }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(reports);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tenantId = (session.user as any).tenantId;
  const data = await req.json();
  const nextSend = computeNextSend(data.frequency);
  const report = await prisma.scheduledReport.create({
    data: { name: data.name, reportType: data.reportType, frequency: data.frequency, filters: data.filters || {}, recipients: data.recipients || [], nextSend, tenantId },
  });
  return NextResponse.json(report);
}

function computeNextSend(frequency: string): Date {
  const now = new Date();
  if (frequency === "DAILY") return new Date(now.getTime() + 86400000);
  if (frequency === "WEEKLY") return new Date(now.getTime() + 7 * 86400000);
  return new Date(now.getFullYear(), now.getMonth() + 1, 1);
}
