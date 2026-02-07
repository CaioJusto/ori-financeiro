"use client";
import { useEffect, useState, use } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import { FileBarChart, AlertCircle } from "lucide-react";

interface SharedData {
  reportType: string;
  filters: Record<string, unknown>;
  createdAt: string;
  expiresAt: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}

export default function SharedReportPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [report, setReport] = useState<SharedData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/shared/${token}`)
      .then(r => { if (!r.ok) throw new Error(r.status === 410 ? "Link expirado" : "Relatório não encontrado"); return r.json(); })
      .then(setReport)
      .catch(e => setError(e.message));
  }, [token]);

  if (error) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full"><CardContent className="p-12 text-center">
        <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
        <p className="text-lg font-medium">{error}</p>
      </CardContent></Card>
    </div>
  );

  if (!report) return (
    <div className="min-h-screen flex items-center justify-center"><div className="animate-pulse text-muted-foreground">Carregando...</div></div>
  );

  const typeLabels: Record<string, string> = { monthly: "Resumo Mensal", category: "Por Categoria", general: "Geral" };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <FileBarChart className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-xl font-semibold">Relatório Compartilhado</h1>
            <p className="text-sm text-muted-foreground">{typeLabels[report.reportType] || report.reportType} • Expira em {new Date(report.expiresAt).toLocaleDateString("pt-BR")}</p>
          </div>
        </div>
        <Separator className="mb-6" />

        {report.reportType === "monthly" && report.data && (
          <>
            <div className="grid gap-4 grid-cols-3 mb-6">
              <Card><CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">Receitas</p>
                <p className="text-xl font-bold text-emerald-500">{formatCurrency(report.data.income)}</p>
              </CardContent></Card>
              <Card><CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">Despesas</p>
                <p className="text-xl font-bold text-red-500">{formatCurrency(report.data.expense)}</p>
              </CardContent></Card>
              <Card><CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">Saldo</p>
                <p className={`text-xl font-bold ${report.data.balance >= 0 ? "text-emerald-500" : "text-red-500"}`}>{formatCurrency(report.data.balance)}</p>
              </CardContent></Card>
            </div>
            <Card>
              <CardHeader><CardTitle className="text-sm">Transações</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Descrição</TableHead><TableHead>Categoria</TableHead><TableHead>Data</TableHead><TableHead className="text-right">Valor</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {report.data.transactions?.map((t: any) => (
                      <TableRow key={t.id}>
                        <TableCell className="text-sm font-medium">{t.description}</TableCell>
                        <TableCell><Badge variant="secondary">{t.category?.name}</Badge></TableCell>
                        <TableCell className="text-sm text-muted-foreground">{new Date(t.date).toLocaleDateString("pt-BR")}</TableCell>
                        <TableCell className={`text-sm font-semibold text-right ${t.type === "income" ? "text-emerald-500" : "text-red-500"}`}>
                          {t.type === "income" ? "+" : "-"}{formatCurrency(t.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}

        {report.reportType === "category" && report.data && (
          <Card>
            <CardHeader><CardTitle className="text-sm">Gastos por Categoria</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {report.data.categories?.map((c: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="text-sm font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.count} transações</p>
                    </div>
                    <p className="text-sm font-bold text-red-500">{formatCurrency(c.total)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {!["monthly", "category"].includes(report.reportType) && report.data?.transactions && (
          <Card>
            <CardHeader><CardTitle className="text-sm">Transações</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Descrição</TableHead><TableHead>Data</TableHead><TableHead className="text-right">Valor</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {report.data.transactions.map((t: any) => (
                    <TableRow key={t.id}>
                      <TableCell className="text-sm">{t.description}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{new Date(t.date).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell className={`text-sm font-semibold text-right ${t.type === "income" ? "text-emerald-500" : "text-red-500"}`}>
                        {t.type === "income" ? "+" : "-"}{formatCurrency(t.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <p className="text-center text-xs text-muted-foreground mt-8">Gerado pelo Ori Financeiro</p>
      </div>
    </div>
  );
}
