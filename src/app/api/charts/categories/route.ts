import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import { requirePermission } from "@/lib/tenant";

const width = 600;
const height = 600;
const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, backgroundColour: "white" });

export async function GET(req: NextRequest) {
  const { error, tenant } = await requirePermission("reports:read");
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: Record<string, unknown> = { type: "expense", tenantId: tenant.tenantId };
  if (from || to) {
    where.date = {};
    if (from) (where.date as Record<string, unknown>).gte = new Date(from);
    if (to) (where.date as Record<string, unknown>).lte = new Date(to);
  }

  const transactions = await prisma.transaction.findMany({ where, include: { category: true } });

  const catMap = new Map<string, { name: string; color: string; total: number }>();
  for (const t of transactions) {
    const e = catMap.get(t.categoryId) || { name: t.category.name, color: t.category.color, total: 0 };
    e.total += t.amount;
    catMap.set(t.categoryId, e);
  }

  const cats = Array.from(catMap.values()).sort((a, b) => b.total - a.total);

  const format = searchParams.get("format");
  if (format === "png") {
    const buf = await chartJSNodeCanvas.renderToBuffer({
      type: "pie",
      data: {
        labels: cats.map((c) => c.name),
        datasets: [{ data: cats.map((c) => c.total), backgroundColor: cats.map((c) => c.color) }],
      },
      options: { plugins: { title: { display: true, text: "Gastos por Categoria", font: { size: 18 } } } },
    });
    return new NextResponse(new Uint8Array(buf), { headers: { "Content-Type": "image/png" } });
  }

  return NextResponse.json(cats);
}
