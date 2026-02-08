import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  const { error, tenant } = await requirePermission("transactions:read");
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const accountId = searchParams.get("accountId");
  const categoryId = searchParams.get("categoryId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const search = searchParams.get("search");
  const tagId = searchParams.get("tagId");
  const type = searchParams.get("type");
  const minAmount = searchParams.get("minAmount");
  const maxAmount = searchParams.get("maxAmount");
  const sortBy = searchParams.get("sortBy") || "date";
  const sortOrder = searchParams.get("sortOrder") || "desc";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { tenantId: tenant.tenantId };
  if (accountId) where.accountId = accountId;
  if (categoryId) where.categoryId = categoryId;
  if (search) where.description = { contains: search, mode: "insensitive" };
  if (tagId) where.tags = { some: { tagId } };
  if (type && type !== "all") where.type = type;
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from);
    if (to) where.date.lte = new Date(to + "T23:59:59");
  }
  if (minAmount || maxAmount) {
    where.amount = {};
    if (minAmount) where.amount.gte = parseFloat(minAmount);
    if (maxAmount) where.amount.lte = parseFloat(maxAmount);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orderBy: any = {};
  if (sortBy === "amount") orderBy.amount = sortOrder;
  else if (sortBy === "description") orderBy.description = sortOrder;
  else orderBy.date = sortOrder;

  const transactions = await prisma.transaction.findMany({
    where,
    include: { account: true, category: true, tags: { include: { tag: true } } },
    orderBy,
  });
  return NextResponse.json(transactions);
}

export async function POST(req: NextRequest) {
  const { error, tenant } = await requirePermission("transactions:write");
  if (error) return error;

  const body = await req.json();
  if (!body.description || !body.amount || !body.type || !body.date || !body.accountId || !body.categoryId) {
    return NextResponse.json({ error: "description, amount, type, date, accountId, and categoryId are required" }, { status: 400 });
  }
  const tagIds: string[] = body.tagIds || [];
  try {
  const transaction = await prisma.transaction.create({
    data: {
      description: body.description,
      amount: parseFloat(body.amount),
      type: body.type,
      date: new Date(body.date),
      accountId: body.accountId,
      categoryId: body.categoryId,
      tenantId: tenant.tenantId,
      ...(body.notes ? { notes: body.notes } : {}),
      ...(body.creditCardId ? { creditCardId: body.creditCardId } : {}),
      ...(tagIds.length > 0 ? { tags: { create: tagIds.map((tid: string) => ({ tagId: tid })) } } : {}),
    },
    include: { account: true, category: true, tags: { include: { tag: true } } },
  });
  await logAudit("create", "transaction", transaction.id, { description: body.description, amount: body.amount, type: body.type }, tenant.tenantId);
  return NextResponse.json(transaction);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    if (msg.includes("Foreign key constraint")) {
      return NextResponse.json({ error: "Invalid accountId or categoryId" }, { status: 400 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
