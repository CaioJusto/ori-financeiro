import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

const GOAL_TEMPLATES = [
  { id: "emergency-6m", name: "Fundo de Emergência 6 meses", targetAmount: 30000, category: "EMERGENCY", icon: "🛡️", description: "6 meses de despesas para imprevistos" },
  { id: "travel-5k", name: "Viagem R$5.000", targetAmount: 5000, category: "TRAVEL", icon: "✈️", description: "Próxima viagem dos sonhos" },
  { id: "car-50k", name: "Carro R$50.000", targetAmount: 50000, category: "VEHICLE", icon: "🚗", description: "Entrada ou valor total do carro" },
  { id: "house-down", name: "Entrada Casa R$100.000", targetAmount: 100000, category: "PROPERTY", icon: "🏠", description: "Entrada para financiamento imobiliário" },
  { id: "retirement", name: "Aposentadoria R$1.000.000", targetAmount: 1000000, category: "RETIREMENT", icon: "🏖️", description: "Independência financeira" },
  { id: "education", name: "Curso/Faculdade R$15.000", targetAmount: 15000, category: "EDUCATION", icon: "🎓", description: "Investimento em educação" },
  { id: "wedding", name: "Casamento R$30.000", targetAmount: 30000, category: "EVENT", icon: "💍", description: "Celebração especial" },
  { id: "tech", name: "Notebook/Setup R$8.000", targetAmount: 8000, category: "TECH", icon: "💻", description: "Upgrade de tecnologia" },
];

export async function GET() {
  const { error } = await requirePermission("goals.view");
  if (error) return error;

  return NextResponse.json(GOAL_TEMPLATES);
}
