import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

// PDF generation endpoint - returns JSON representation for client-side PDF generation
export async function POST(req: NextRequest) {
  const { error, tenant } = await requirePermission("reports.export");
  if (error) return error;

  const body = await req.json();
  const { reportType, title, data, filters } = body;

  // In production, you'd use a PDF library like puppeteer or jsPDF on the server
  // For now, return structured data that the client can use to generate PDFs
  const report = {
    id: `report_${Date.now()}`,
    title: title || `Relatório ${reportType || "Geral"}`,
    generatedAt: new Date().toISOString(),
    tenantId: tenant.tenantId,
    reportType: reportType || "general",
    filters: filters || {},
    data: data || {},
    format: "json", // Client will convert to PDF
  };

  return NextResponse.json(report);
}
