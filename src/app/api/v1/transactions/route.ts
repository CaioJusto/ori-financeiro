import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKey } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const { error, tenantId } = await authenticateApiKey(req);
  if (error) return error;

  const url = req.nextUrl;
  const limit = parseInt(url.searchParams.get("limit") || "50");
  const offset = parseInt(url.searchParams.get("offset") || "0");

  const transactions = await prisma.transaction.findMany({
    where: { tenantId: tenantId! },
    include: { category: { select: { name: true } }, account: { select: { name: true } } },
    orderBy: { date: "desc" },
    take: Math.min(limit, 100),
    skip: offset,
  });

  return NextResponse.json({ data: transactions, count: transactions.length });
}

export async function POST(req: NextRequest) {
  const { error, tenantId } = await authenticateApiKey(req);
  if (error) return error;

  const body = await req.json();
  const { description, amount, type, date, accountId, categoryId } = body;

  if (!description || !amount || !type || !accountId || !categoryId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const transaction = await prisma.transaction.create({
    data: {
      description, amount, type,
      date: new Date(date || new Date()),
      accountId, categoryId,
      tenantId: tenantId!,
    },
  });

  return NextResponse.json(transaction, { status: 201 });
}
