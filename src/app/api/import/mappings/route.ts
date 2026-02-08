import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function GET() {
  const { error } = await requirePermission("transactions:read");
  if (error) return error;
  return NextResponse.json({
    mappings: [
      { format: "CSV", fields: ["date", "description", "amount", "type", "category", "account"] },
      { format: "OFX", fields: ["auto-mapped"] },
      { format: "QIF", fields: ["auto-mapped"] },
    ],
  });
}
