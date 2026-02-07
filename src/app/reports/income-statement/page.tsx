"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { PageWrapper, AnimatedItem } from "@/components/page-wrapper";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Data {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  incomeBreakdown: { name: string; total: number }[];
  expenseBreakdown: { name: string; total: number }[];
}

export default function IncomeStatementPage() {
  const [data, setData] = useState<Data | null>(null);
  const now = new Date();
  const [startDate, setStartDate] = useState(`${now.getFullYear()}-01-01`);
  const [endDate, setEndDate] = useState(now.toISOString().split("T")[0]);

  useEffect(() => {
    fetch(`/api/reports/income-statement?startDate=${startDate}&endDate=${endDate}`)
      .then(r => r.json()).then(setData);
  }, [startDate, endDate]);

  if (!data) return <div className="p-8">Carregando...</div>;

  const chartData = [
    ...data.incomeBreakdown.map(i => ({ name: i.name, Receita: i.total, Despesa: 0 })),
    ...data.expenseBreakdown.map(e => ({ name: e.name, Receita: 0, Despesa: e.total })),
  ];

  return (
    <PageWrapper><AnimatedItem><h1 className="text-2xl font-bold">Demonstração de Resultado (DRE)</h1><p className="text-muted-foreground mb-6">Receitas, despesas e lucro líquido por período</p></AnimatedItem>
      <AnimatedItem>
        <div className="flex gap-4 mb-6">
          <div><Label>Data Início</Label><Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
          <div><Label>Data Fim</Label><Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
        </div>
      </AnimatedItem>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <AnimatedItem>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Receita Total</CardTitle><TrendingUp className="h-4 w-4 text-green-500" /></CardHeader>
            <CardContent><div className="text-2xl font-bold text-green-600">{formatCurrency(data.totalIncome)}</div></CardContent>
          </Card>
        </AnimatedItem>
        <AnimatedItem>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Despesa Total</CardTitle><TrendingDown className="h-4 w-4 text-red-500" /></CardHeader>
            <CardContent><div className="text-2xl font-bold text-red-600">{formatCurrency(data.totalExpenses)}</div></CardContent>
          </Card>
        </AnimatedItem>
        <AnimatedItem>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle><DollarSign className="h-4 w-4 text-blue-500" /></CardHeader>
            <CardContent><div className={`text-2xl font-bold ${data.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>{formatCurrency(data.netProfit)}</div></CardContent>
          </Card>
        </AnimatedItem>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <AnimatedItem>
          <Card>
            <CardHeader><CardTitle>Receitas por Categoria</CardTitle></CardHeader>
            <CardContent>
              <Table><TableHeader><TableRow><TableHead>Categoria</TableHead><TableHead className="text-right">Valor</TableHead><TableHead className="text-right">%</TableHead></TableRow></TableHeader>
                <TableBody>
                  {data.incomeBreakdown.map(i => (
                    <TableRow key={i.name}><TableCell>{i.name}</TableCell><TableCell className="text-right text-green-600">{formatCurrency(i.total)}</TableCell><TableCell className="text-right">{data.totalIncome > 0 ? ((i.total / data.totalIncome) * 100).toFixed(1) : 0}%</TableCell></TableRow>
                  ))}
                  <TableRow className="font-bold"><TableCell>Total</TableCell><TableCell className="text-right text-green-600">{formatCurrency(data.totalIncome)}</TableCell><TableCell className="text-right">100%</TableCell></TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </AnimatedItem>
        <AnimatedItem>
          <Card>
            <CardHeader><CardTitle>Despesas por Categoria</CardTitle></CardHeader>
            <CardContent>
              <Table><TableHeader><TableRow><TableHead>Categoria</TableHead><TableHead className="text-right">Valor</TableHead><TableHead className="text-right">%</TableHead></TableRow></TableHeader>
                <TableBody>
                  {data.expenseBreakdown.map(e => (
                    <TableRow key={e.name}><TableCell>{e.name}</TableCell><TableCell className="text-right text-red-600">{formatCurrency(e.total)}</TableCell><TableCell className="text-right">{data.totalExpenses > 0 ? ((e.total / data.totalExpenses) * 100).toFixed(1) : 0}%</TableCell></TableRow>
                  ))}
                  <TableRow className="font-bold"><TableCell>Total</TableCell><TableCell className="text-right text-red-600">{formatCurrency(data.totalExpenses)}</TableCell><TableCell className="text-right">100%</TableCell></TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </AnimatedItem>
      </div>

      <AnimatedItem>
        <Card>
          <CardHeader><CardTitle>Visão Geral</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={12} /><YAxis /><Tooltip formatter={(v) => formatCurrency(Number(v || 0))} /><Bar dataKey="Receita" fill="#22c55e" /><Bar dataKey="Despesa" fill="#ef4444" /></BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </AnimatedItem>
    </PageWrapper>
  );
}
