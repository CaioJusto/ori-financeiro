import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";
import * as XLSX from "xlsx";

export async function POST(req: NextRequest) {
  const { error, tenant } = await requirePermission("reports.export");
  if (error) return error;

  const body = await req.json();
  const { reportType, dateFrom, dateTo } = body;

  const tid = tenant.tenantId;
  const from = dateFrom ? new Date(dateFrom) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const to = dateTo ? new Date(dateTo) : new Date();

  const transactions = await prisma.transaction.findMany({
    where: { tenantId: tid, date: { gte: from, lte: to } },
    include: { category: true, account: true, contact: true },
    orderBy: { date: "desc" },
  });

  // Summary sheet
  const income = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  const summaryData = [
    ["Relatório Financeiro", ""],
    ["Período", `${from.toLocaleDateString("pt-BR")} - ${to.toLocaleDateString("pt-BR")}`],
    ["", ""],
    ["Receitas", income],
    ["Despesas", expense],
    ["Saldo", income - expense],
    ["", ""],
    ["Total Transações", transactions.length],
  ];

  // Detail sheet
  const detailData = transactions.map(t => ({
    Data: t.date.toLocaleDateString("pt-BR"),
    Descrição: t.description,
    Tipo: t.type === "income" ? "Receita" : "Despesa",
    Valor: t.amount,
    Categoria: t.category?.name || "-",
    Conta: t.account?.name || "-",
    Contato: t.contact?.name || "-",
  }));

  // By category sheet
  const byCat: Record<string, { income: number; expense: number }> = {};
  transactions.forEach(t => {
    const cat = t.category?.name || "Outros";
    if (!byCat[cat]) byCat[cat] = { income: 0, expense: 0 };
    if (t.type === "income") byCat[cat].income += t.amount;
    else byCat[cat].expense += t.amount;
  });
  const categoryData = Object.entries(byCat).map(([cat, data]) => ({
    Categoria: cat,
    Receitas: data.income,
    Despesas: data.expense,
    Saldo: data.income - data.expense,
  }));

  const wb = XLSX.utils.book_new();
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, "Resumo");
  const wsDetail = XLSX.utils.json_to_sheet(detailData);
  XLSX.utils.book_append_sheet(wb, wsDetail, "Transações");
  const wsCategory = XLSX.utils.json_to_sheet(categoryData);
  XLSX.utils.book_append_sheet(wb, wsCategory, "Por Categoria");

  const buffer = XLSX.write(wb, { type: "buffer", bookType: reportType === "csv" ? "csv" : "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="relatorio-${from.toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
