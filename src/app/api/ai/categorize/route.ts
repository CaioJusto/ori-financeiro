import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function POST(req: NextRequest) {
  const { error, tenant } = await requirePermission("transactions.create");
  if (error) return error;

  const { description } = await req.json();
  if (!description) return NextResponse.json({ error: "Description required" }, { status: 400 });

  const desc = description.toLowerCase().trim();

  // 1. Try exact rule match
  const rules = await prisma.rule.findMany({
    where: { tenantId: tenant.tenantId, active: true },
  });

  for (const rule of rules) {
    if (desc.includes(rule.pattern.toLowerCase())) {
      if (rule.categoryId) {
        const cat = await prisma.category.findUnique({ where: { id: rule.categoryId } });
        if (cat) return NextResponse.json({ categoryId: cat.id, categoryName: cat.name, confidence: 0.95, method: "rule" });
      }
    }
  }

  // 2. Fuzzy match against existing transaction descriptions
  const recentTx = await prisma.transaction.findMany({
    where: { tenantId: tenant.tenantId },
    include: { category: true },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  const descWords = desc.split(/\s+/);
  let bestMatch: { categoryId: string; categoryName: string; score: number } | null = null;

  for (const tx of recentTx) {
    const txDesc = tx.description.toLowerCase();
    let score = 0;
    if (txDesc === desc) { score = 1; }
    else if (txDesc.includes(desc) || desc.includes(txDesc)) { score = 0.8; }
    else {
      const txWords = txDesc.split(/\s+/);
      const common = descWords.filter((w: string) => txWords.some((tw: string) => tw.includes(w) || w.includes(tw)));
      score = common.length / Math.max(descWords.length, txWords.length);
    }
    if (score > (bestMatch?.score || 0.3)) {
      bestMatch = { categoryId: tx.categoryId, categoryName: tx.category.name, score };
    }
  }

  if (bestMatch) {
    return NextResponse.json({ categoryId: bestMatch.categoryId, categoryName: bestMatch.categoryName, confidence: bestMatch.score, method: "fuzzy" });
  }

  // 3. Keyword-based fallback
  const keywords: Record<string, string[]> = {
    "Alimentação": ["comida", "restaurante", "lanche", "pizza", "burger", "ifood", "supermercado", "mercado", "padaria", "café"],
    "Transporte": ["uber", "99", "combustível", "gasolina", "estacionamento", "pedágio", "ônibus", "metrô"],
    "Moradia": ["aluguel", "condomínio", "iptu", "luz", "água", "gás", "internet"],
    "Saúde": ["farmácia", "médico", "hospital", "plano de saúde", "dentista", "exame"],
    "Educação": ["curso", "escola", "faculdade", "livro", "udemy", "alura"],
    "Lazer": ["cinema", "netflix", "spotify", "jogo", "viagem", "hotel", "streaming"],
    "Tecnologia": ["software", "hosting", "domínio", "cloud", "aws", "github"],
  };

  const categories = await prisma.category.findMany({ where: { tenantId: tenant.tenantId } });

  for (const [catName, kws] of Object.entries(keywords)) {
    if (kws.some(kw => desc.includes(kw))) {
      const cat = categories.find(c => c.name === catName);
      if (cat) return NextResponse.json({ categoryId: cat.id, categoryName: cat.name, confidence: 0.6, method: "keyword" });
    }
  }

  return NextResponse.json({ categoryId: null, categoryName: null, confidence: 0, method: "none" });
}
