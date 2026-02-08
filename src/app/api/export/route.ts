import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function GET() {
  const { error } = await requirePermission("reports:read");
  if (error) return error;
  return NextResponse.json({
    formats: [
      { id: "excel", name: "Excel (.xlsx)", endpoint: "/api/export/excel" },
      { id: "pdf", name: "PDF", endpoint: "/api/export/pdf" },
      { id: "report", name: "Report", endpoint: "/api/export/report" },
    ],
  });
}
