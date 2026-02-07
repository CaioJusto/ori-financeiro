import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";
import { MOCK_INSTITUTIONS } from "@/lib/open-finance-mock";

export async function GET(req: NextRequest) {
  const { error } = await requirePermission("settings.view");
  if (error) return error;

  const search = req.nextUrl.searchParams.get("search")?.toLowerCase() || "";
  const type = req.nextUrl.searchParams.get("type") || "";

  let results = MOCK_INSTITUTIONS;

  if (search) {
    results = results.filter(i => i.name.toLowerCase().includes(search));
  }
  if (type) {
    results = results.filter(i => i.type === type);
  }

  return NextResponse.json(results);
}
