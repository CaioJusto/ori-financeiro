"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { PageWrapper, AnimatedItem } from "@/components/page-wrapper";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const COLORS = ["#7c3aed", "#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#ec4899", "#06b6d4", "#8b5cf6", "#14b8a6", "#f97316"];

interface Data { categories: string[]; series: Record<string, unknown>[] }

export default function TrendAnalysisPage() {
  const [data, setData] = useState<Data | null>(null);
  const [visible, setVisible] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/reports/trend-analysis").then(r => r.json()).then((d: Data) => {
      setData(d);
      setVisible(new Set(d.categories.slice(0, 5)));
    });
  }, []);

  if (!data) return <div className="p-8">Carregando...</div>;

  return (
    <PageWrapper><AnimatedItem><h1 className="text-2xl font-bold">Análise de Tendências</h1><p className="text-muted-foreground mb-6">Comparação de gastos por categoria nos últimos 12 meses</p></AnimatedItem>
      <AnimatedItem>
        <Card className="mb-6">
          <CardHeader><CardTitle>Categorias</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.categories.map((cat, i) => (
                <button key={cat} onClick={() => setVisible(prev => { const n = new Set(prev); if (n.has(cat)) n.delete(cat); else n.add(cat); return n; })}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${visible.has(cat) ? "text-white" : "bg-muted text-muted-foreground"}`}
                  style={visible.has(cat) ? { backgroundColor: COLORS[i % COLORS.length] } : {}}>
                  {cat}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </AnimatedItem>

      <AnimatedItem>
        <Card>
          <CardHeader><CardTitle>Tendência de Gastos</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={data.series}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(v: number) => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => formatCurrency(Number(v || 0))} />
                <Legend />
                {data.categories.filter(c => visible.has(c)).map((cat, i) => (
                  <Line key={cat} type="monotone" dataKey={cat} stroke={COLORS[data.categories.indexOf(cat) % COLORS.length]} strokeWidth={2} dot={{ r: 3 }} connectNulls />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </AnimatedItem>
    </PageWrapper>
  );
}
