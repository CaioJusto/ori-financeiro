"use client";
import { useEffect, useState } from "react";
import { PageWrapper } from "@/components/page-wrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown, DollarSign, Users, AlertTriangle, BarChart3 } from "lucide-react";

interface MRRData {
  currentMRR: number;
  mrrHistory: { months: string[]; values: number[] };
  growthRate: number;
  churnRate: number;
  churnAmount: number;
  newRevenue: number;
  recurringItems: { description: string; avgAmount: number; contact: string | null; monthCount: number }[];
  byClient: Record<string, number>;
}

export default function MRRPage() {
  const [data, setData] = useState<MRRData | null>(null);

  useEffect(() => {
    fetch("/api/mrr").then(r => r.json()).then(setData).catch(() => {});
  }, []);

  if (!data) return <PageWrapper><div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /></div></PageWrapper>;

  return (
    <PageWrapper>
      <div className="grid gap-4">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <DollarSign className="h-5 w-5 mx-auto mb-1 text-green-500" />
              <p className="text-2xl font-bold text-green-600">{formatCurrency(data.currentMRR)}</p>
              <p className="text-xs text-muted-foreground">MRR Atual</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              {data.growthRate >= 0 ? <TrendingUp className="h-5 w-5 mx-auto mb-1 text-green-500" /> : <TrendingDown className="h-5 w-5 mx-auto mb-1 text-red-500" />}
              <p className={`text-2xl font-bold ${data.growthRate >= 0 ? "text-green-600" : "text-red-600"}`}>{data.growthRate > 0 ? "+" : ""}{data.growthRate}%</p>
              <p className="text-xs text-muted-foreground">Crescimento</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <AlertTriangle className="h-5 w-5 mx-auto mb-1 text-yellow-500" />
              <p className="text-2xl font-bold">{data.churnRate}%</p>
              <p className="text-xs text-muted-foreground">Churn ({formatCurrency(data.churnAmount)})</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-5 w-5 mx-auto mb-1 text-blue-500" />
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(data.newRevenue)}</p>
              <p className="text-xs text-muted-foreground">Nova Receita</p>
            </CardContent>
          </Card>
        </div>

        {/* MRR History Chart */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Histórico MRR</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.mrrHistory.months.map((month, i) => {
                const val = data.mrrHistory.values[i] || 0;
                const maxVal = Math.max(...data.mrrHistory.values) || 1;
                return (
                  <div key={month} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-16">{month}</span>
                    <div className="flex-1 flex items-center gap-2">
                      <div className="h-4 bg-primary rounded-full transition-all" style={{ width: `${(val / maxVal) * 100}%` }} />
                      <span className="text-xs font-medium">{formatCurrency(val)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Recurring Items */}
          <Card>
            <CardHeader><CardTitle>Receitas Recorrentes</CardTitle></CardHeader>
            <CardContent>
              {data.recurringItems.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhuma receita recorrente detectada.</p>
              ) : (
                <div className="space-y-2">
                  {data.recurringItems.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <p className="text-sm font-medium capitalize">{item.description}</p>
                        <p className="text-xs text-muted-foreground">{item.contact || "—"} · {item.monthCount} meses</p>
                      </div>
                      <p className="font-medium text-green-600">{formatCurrency(item.avgAmount)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* By Client */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Por Cliente/Fonte</CardTitle></CardHeader>
            <CardContent>
              {Object.entries(data.byClient).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Sem dados.</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(data.byClient).sort((a, b) => b[1] - a[1]).map(([client, amount]) => (
                    <div key={client} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm capitalize">{client}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{data.currentMRR > 0 ? Math.round((amount / data.currentMRR) * 100) : 0}%</Badge>
                        <span className="text-sm font-medium">{formatCurrency(amount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageWrapper>
  );
}
