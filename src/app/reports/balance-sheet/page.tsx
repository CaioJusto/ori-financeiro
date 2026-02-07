"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { PageWrapper, AnimatedItem } from "@/components/page-wrapper";
import { TrendingUp, TrendingDown, Scale } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface BalanceItem { id: string; name: string; type: string; color: string; balance: number }
interface Data { assets: BalanceItem[]; liabilities: BalanceItem[]; totalAssets: number; totalLiabilities: number; netWorth: number }

export default function BalanceSheetPage() {
  const [data, setData] = useState<Data | null>(null);

  useEffect(() => { fetch("/api/reports/balance-sheet").then(r => r.json()).then(setData); }, []);

  if (!data) return <div className="p-8">Carregando...</div>;

  const chartData = [
    { name: "Ativos", value: data.totalAssets },
    { name: "Passivos", value: data.totalLiabilities },
    { name: "Patrimônio Líquido", value: Math.max(0, data.netWorth) },
  ];

  return (
    <PageWrapper><AnimatedItem><h1 className="text-2xl font-bold">Balanço Patrimonial</h1><p className="text-muted-foreground mb-6">Visão simplificada de ativos, passivos e patrimônio líquido</p></AnimatedItem>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <AnimatedItem><Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm">Total Ativos</CardTitle><TrendingUp className="h-4 w-4 text-green-500" /></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{formatCurrency(data.totalAssets)}</div></CardContent></Card></AnimatedItem>
        <AnimatedItem><Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm">Total Passivos</CardTitle><TrendingDown className="h-4 w-4 text-red-500" /></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">{formatCurrency(data.totalLiabilities)}</div></CardContent></Card></AnimatedItem>
        <AnimatedItem><Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm">Patrimônio Líquido</CardTitle><Scale className="h-4 w-4 text-blue-500" /></CardHeader><CardContent><div className={`text-2xl font-bold ${data.netWorth >= 0 ? "text-green-600" : "text-red-600"}`}>{formatCurrency(data.netWorth)}</div></CardContent></Card></AnimatedItem>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <AnimatedItem>
          <Card><CardHeader><CardTitle>Ativos</CardTitle></CardHeader><CardContent>
            <Table><TableHeader><TableRow><TableHead>Conta</TableHead><TableHead>Tipo</TableHead><TableHead className="text-right">Saldo</TableHead></TableRow></TableHeader>
              <TableBody>
                {data.assets.map(a => <TableRow key={a.id}><TableCell><span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: a.color }} />{a.name}</TableCell><TableCell className="capitalize">{a.type}</TableCell><TableCell className="text-right text-green-600">{formatCurrency(a.balance)}</TableCell></TableRow>)}
                <TableRow className="font-bold"><TableCell colSpan={2}>Total</TableCell><TableCell className="text-right text-green-600">{formatCurrency(data.totalAssets)}</TableCell></TableRow>
              </TableBody>
            </Table>
          </CardContent></Card>
        </AnimatedItem>
        <AnimatedItem>
          <Card><CardHeader><CardTitle>Passivos</CardTitle></CardHeader><CardContent>
            <Table><TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Tipo</TableHead><TableHead className="text-right">Saldo</TableHead></TableRow></TableHeader>
              <TableBody>
                {data.liabilities.map(l => <TableRow key={l.id}><TableCell><span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: l.color }} />{l.name}</TableCell><TableCell className="capitalize">{l.type}</TableCell><TableCell className="text-right text-red-600">{formatCurrency(l.balance)}</TableCell></TableRow>)}
                {data.liabilities.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">Nenhum passivo</TableCell></TableRow>}
                <TableRow className="font-bold"><TableCell colSpan={2}>Total</TableCell><TableCell className="text-right text-red-600">{formatCurrency(data.totalLiabilities)}</TableCell></TableRow>
              </TableBody>
            </Table>
          </CardContent></Card>
        </AnimatedItem>
      </div>

      <AnimatedItem>
        <Card><CardHeader><CardTitle>Resumo</CardTitle></CardHeader><CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip formatter={(v) => formatCurrency(Number(v || 0))} /><Bar dataKey="value" fill="#7c3aed" /></BarChart>
          </ResponsiveContainer>
        </CardContent></Card>
      </AnimatedItem>
    </PageWrapper>
  );
}
