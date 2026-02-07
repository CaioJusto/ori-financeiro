import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import { requirePermission } from "@/lib/tenant";

const width = 800;
const height = 400;
const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, backgroundColour: "white" });

export async function GET(req: NextRequest) {
  const { error, tenant } = await requirePermission("reports:read");
  if (error) return error;

  const months = parseInt(new URL(req.url).searchParams.get("months") || "6");
  const transactions = await prisma.transaction.findMany({ where: { tenantId: tenant.tenantId }, orderBy: { date: "desc" } });

  const now = new Date();
  const labels: string[] = [];
  const incomeData: number[] = [];
  const expenseData: number[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const m = d.getMonth();
    const y = d.getFullYear();
    labels.push(d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }));
    const monthTx = transactions.filter((t) => { const td = new Date(t.date); return td.getMonth() === m && td.getFullYear() === y; });
    incomeData.push(monthTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0));
    expenseData.push(monthTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0));
  }

  const buf = await chartJSNodeCanvas.renderToBuffer({
    type: "bar",
    data: {
      labels,
      datasets: [
        { label: "Receitas", data: incomeData, backgroundColor: "rgba(34,197,94,0.7)" },
        { label: "Despesas", data: expenseData, backgroundColor: "rgba(239,68,68,0.7)" },
      ],
    },
    options: {
      plugins: { title: { display: true, text: "Receitas vs Despesas", font: { size: 18 } } },
      scales: { y: { beginAtZero: true } },
    },
  });

  return new NextResponse(new Uint8Array(buf), { headers: { "Content-Type": "image/png" } });
}
