import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenant } = await requirePermission("invoices:read");
  if (error) return error;
  const { id } = await params;
  const invoice = await prisma.invoice.findFirst({ where: { id, tenantId: tenant.tenantId } });
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const items = (invoice.items as { description: string; quantity: number; price: number }[]) || [];
  const itemRows = items.map(i =>
    `<tr><td style="padding:8px;border-bottom:1px solid #eee">${i.description}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${i.quantity}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">R$ ${(i.price).toFixed(2)}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">R$ ${(i.quantity * i.price).toFixed(2)}</td></tr>`
  ).join("");

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Fatura ${invoice.number}</title></head>
<body style="font-family:Arial,sans-serif;max-width:800px;margin:0 auto;padding:40px;color:#333">
<div style="display:flex;justify-content:space-between;margin-bottom:40px">
<div><h1 style="color:#7c3aed;margin:0">FATURA</h1><p style="color:#666;margin:4px 0">${invoice.number}</p></div>
<div style="text-align:right"><p style="margin:4px 0"><strong>Status:</strong> ${invoice.status}</p>
<p style="margin:4px 0"><strong>Emissão:</strong> ${new Date(invoice.createdAt).toLocaleDateString("pt-BR")}</p>
<p style="margin:4px 0"><strong>Vencimento:</strong> ${new Date(invoice.dueDate).toLocaleDateString("pt-BR")}</p></div></div>
<div style="margin-bottom:30px"><h3 style="margin:0 0 8px">Cliente</h3><p style="margin:0">${invoice.clientName}</p>
${invoice.clientEmail ? `<p style="margin:0;color:#666">${invoice.clientEmail}</p>` : ""}</div>
<table style="width:100%;border-collapse:collapse;margin-bottom:30px">
<thead><tr style="background:#f8f9fa"><th style="padding:8px;text-align:left">Descrição</th><th style="padding:8px;text-align:center">Qtd</th><th style="padding:8px;text-align:right">Preço Unit.</th><th style="padding:8px;text-align:right">Total</th></tr></thead>
<tbody>${itemRows}</tbody></table>
<div style="text-align:right"><p>Subtotal: <strong>R$ ${invoice.subtotal.toFixed(2)}</strong></p>
<p>Impostos: <strong>R$ ${invoice.tax.toFixed(2)}</strong></p>
<p style="font-size:1.2em;color:#7c3aed"><strong>Total: R$ ${invoice.total.toFixed(2)}</strong></p></div>
${invoice.notes ? `<div style="margin-top:30px;padding:16px;background:#f8f9fa;border-radius:8px"><h4 style="margin:0 0 8px">Observações</h4><p style="margin:0">${invoice.notes}</p></div>` : ""}
</body></html>`;

  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
