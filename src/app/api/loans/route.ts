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
  let data: any;
  try {
    data = await req.json();
  } catch {
    return NextResponse.json({ error: "Request body is required" }, { status: 400 });
  }
  if (!data || Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Request body is required" }, { status: 400 });
  }
  const principal = parseFloat(data.principal || data.amount || 0);
  const loan = await prisma.loan.create({
    data: {
      name: data.name || "Loan",
      type: data.type || "OTHER",
      principal,
      interestRate: parseFloat(data.interestRate || 0),
      monthlyPayment: parseFloat(data.monthlyPayment || 0),
      totalPaid: parseFloat(data.totalPaid || 0),
      remainingBalance: parseFloat(data.remainingBalance || principal),
      startDate: new Date(data.startDate || new Date()),
      endDate: data.endDate ? new Date(data.endDate) : null,
      status: data.status || "ACTIVE",
      tenantId,
    },
  });
  return NextResponse.json(loan);
}
