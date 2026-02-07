import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function POST(req: NextRequest) {
  const { error, tenant } = await requirePermission("import:write");
  if (error) return error;

  const contentType = req.headers.get("content-type") || "";

  // JSON body (new wizard flow)
  if (contentType.includes("application/json")) {
    const { transactions, filename, format } = await req.json();
    let imported = 0;

    for (const tx of transactions || []) {
      try {
        let date: Date;
        if (tx.date && tx.date.length === 8 && !tx.date.includes("-")) {
          // OFX format: YYYYMMDD
          date = new Date(`${tx.date.slice(0, 4)}-${tx.date.slice(4, 6)}-${tx.date.slice(6, 8)}`);
        } else if (tx.date?.includes("/")) {
          const [d, m, y] = tx.date.split("/");
          date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
        } else {
          date = new Date(tx.date);
        }
        if (isNaN(date.getTime())) date = new Date();

        await prisma.transaction.create({
          data: {
            description: tx.description || "Importado",
            amount: Math.abs(parseFloat(tx.amount) || 0),
            type: tx.type || "expense",
            date,
            accountId: tx.accountId,
            categoryId: tx.categoryId,
            tenantId: tenant.tenantId,
          },
        });
        imported++;
      } catch { /* skip invalid rows */ }
    }

    // Record import history
    await prisma.importHistory.create({
      data: {
        filename: filename || "import.csv",
        format: format || "CSV",
        rowCount: (transactions || []).length,
        imported,
        skipped: (transactions || []).length - imported,
        errors: 0,
        tenantId: tenant.tenantId,
      },
    });

    return NextResponse.json({ imported });
  }

  // FormData body (legacy flow)
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const accountId = formData.get("accountId") as string;
  const categoryId = formData.get("categoryId") as string;

  if (!file || !accountId) return NextResponse.json({ error: "Missing file or accountId" }, { status: 400 });

  const text = await file.text();
  const lines = text.split("\n").filter((l) => l.trim());
  const start = /data|date|descrição|description/i.test(lines[0]) ? 1 : 0;

  let imported = 0;
  for (let i = start; i < lines.length; i++) {
    const parts = lines[i].split(/[,;]/).map((p) => p.trim().replace(/^"|"$/g, ""));
    if (parts.length < 3) continue;
    const [dateStr, description, valueStr] = parts;
    const amount = parseFloat(valueStr.replace(",", "."));
    if (isNaN(amount) || !description) continue;
    const type = amount >= 0 ? "income" : "expense";
    let date: Date;
    if (dateStr.includes("/")) {
      const [d, m, y] = dateStr.split("/");
      date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    } else {
      date = new Date(dateStr);
    }
    if (isNaN(date.getTime())) continue;

    await prisma.transaction.create({
      data: {
        description, amount: Math.abs(amount), type, date,
        accountId, categoryId: categoryId || undefined!,
        tenantId: tenant.tenantId,
      },
    });
    imported++;
  }

  // Record import history
  await prisma.importHistory.create({
    data: {
      filename: file.name,
      format: "CSV",
      rowCount: lines.length - start,
      imported,
      skipped: lines.length - start - imported,
      errors: 0,
      tenantId: tenant.tenantId,
    },
  });

  return NextResponse.json({ imported });
}
