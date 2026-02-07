import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tenantId = (session.user as any).tenantId;
  const loans = await prisma.loan.findMany({ where: { tenantId }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(loans);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tenantId = (session.user as any).tenantId;
  const data = await req.json();
  const loan = await prisma.loan.create({
    data: { ...data, startDate: new Date(data.startDate), endDate: data.endDate ? new Date(data.endDate) : null, tenantId },
  });
  return NextResponse.json(loan);
}
