"use client";
import { useEffect, useState } from "react";
import { PageWrapper } from "@/components/page-wrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/utils";
import { Award, TrendingUp, TrendingDown, Share2, ChevronLeft, ChevronRight, RefreshCw, Lightbulb } from "lucide-react";
import { toast } from "sonner";

interface Snapshot {
  id?: string;
  month: string;
  overallScore: number;
  overallGrade: string;
  spendingControl: number;
  savings: number;
  budgetAdherence: number;
  debtManagement: number;
  investmentGrowth: number;
  recommendations: string[];
  data: { income?: number; expense?: number; savingsRate?: number; totalDebt?: number; totalInvested?: number };
}

function gradeColor(grade: string) {
  if (grade.startsWith("A")) return "text-green-600";
  if (grade.startsWith("B")) return "text-blue-600";
  if (grade.startsWith("C")) return "text-yellow-600";
  if (grade.startsWith("D")) return "text-orange-600";
  return "text-red-600";
}

function scoreToGrade(score: number) {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

const categories = [
  { key: "spendingControl", label: "Controle de Gastos", icon: "💰" },
  { key: "savings", label: "Poupança", icon: "🏦" },
  { key: "budgetAdherence", label: "Aderência ao Orçamento", icon: "🎯" },
  { key: "debtManagement", label: "Gestão de Dívidas", icon: "📊" },
  { key: "investmentGrowth", label: "Crescimento Investimentos", icon: "📈" },
];

export default function SnapshotPage() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [loading, setLoading] = useState(false);

  const load = (m: string) => {
    fetch(`/api/snapshot?month=${m}`).then(r => r.ok ? r.json() : null).then(d => { if (d) setSnapshot(d); else generate(m); }).catch(() => generate(m));
  };

  const generate = (m: string) => {
    setLoading(true);
    fetch("/api/snapshot", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ month: m }) })
      .then(r => r.json()).then(setSnapshot).finally(() => setLoading(false));
  };

  useEffect(() => { load(month); }, [month]);

  const changeMonth = (delta: number) => {
    const [y, m] = month.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };

  const monthLabel = (() => {
    const [y, m] = month.split("-").map(Number);
    return new Date(y, m - 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  })();

  if (!snapshot) return <PageWrapper><div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /></div></PageWrapper>;

  return (
    <PageWrapper>
      <div className="grid gap-4">
        {/* Month navigation */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => changeMonth(-1)}><ChevronLeft className="h-4 w-4" /></Button>
          <h2 className="text-lg font-semibold capitalize">{monthLabel}</h2>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => changeMonth(1)}><ChevronRight className="h-4 w-4" /></Button>
            <Button variant="outline" size="sm" onClick={() => generate(month)} disabled={loading}>
              <RefreshCw className={`h-3 w-3 mr-1 ${loading ? "animate-spin" : ""}`} />Gerar
            </Button>
            <Button variant="outline" size="sm" onClick={() => { toast.success("Link de compartilhamento copiado!"); }}>
              <Share2 className="h-3 w-3 mr-1" />Compartilhar
            </Button>
          </div>
        </div>

        {/* Overall Grade */}
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center gap-4">
              <div className={`text-6xl font-bold ${gradeColor(snapshot.overallGrade)}`}>
                {snapshot.overallGrade}
              </div>
              <div className="text-left">
                <p className="text-3xl font-bold">{snapshot.overallScore}/100</p>
                <p className="text-muted-foreground">Pontuação Geral</p>
                {snapshot.data.income && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Receita: {formatCurrency(snapshot.data.income)} | Despesa: {formatCurrency(snapshot.data.expense || 0)}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category Scores */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {categories.map(cat => {
            const score = snapshot[cat.key as keyof Snapshot] as number;
            const grade = scoreToGrade(score);
            return (
              <Card key={cat.key}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{cat.icon}</span>
                      <span className="text-sm font-medium">{cat.label}</span>
                    </div>
                    <Badge variant="outline" className={gradeColor(grade)}>{grade} ({score})</Badge>
                  </div>
                  <Progress value={score} className="h-2" />
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-muted-foreground">0</span>
                    <span className="text-xs text-muted-foreground">100</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Recommendations */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Lightbulb className="h-5 w-5" /> Recomendações</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {snapshot.recommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <Award className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-sm">{rec}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}
