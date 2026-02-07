import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKey } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const { error, tenantId } = await authenticateApiKey(req);
  if (error) return error;

  const accounts = await prisma.account.findMany({
    where: { tenantId: tenantId! },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ data: accounts });
}
