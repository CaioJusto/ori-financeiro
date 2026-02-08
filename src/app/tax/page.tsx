"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { PageWrapper, AnimatedItem } from "@/components/page-wrapper";
import { Plus, Trash2, Calculator, FileDown } from "lucide-react";
import { toast } from "sonner";

interface TaxCategory { id: string; name: string; type: string; description: string; }
interface TaxSummary {
  year: number; transactions: number; totalIncome: number; totalDeductible: number;
  byCategory: { name: string; total: number; count: number }[];
  taxCategories: TaxCategory[];
  brackets: { min: number; max: number; rate: number; deduction: number }[];
}

const typeLabels: Record<string, string> = { DEDUCTIBLE: "Dedutível", TAXABLE: "Tributável", EXEMPT: "Isento" };
const typeColors: Record<string, string> = { DEDUCTIBLE: "bg-green-500", TAXABLE: "bg-red-500", EXEMPT: "bg-gray-500" };

export default function TaxPage() {
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [summary, setSummary] = useState<TaxSummary | null>(null);
  const [catOpen, setCatOpen] = useState(false);
  const [catForm, setCatForm] = useState({ name: "", type: "DEDUCTIBLE", description: "" });
  const [monthlyIncome, setMonthlyIncome] = useState("");

  const load = () => { fetch(`/api/tax-summary?year=${year}`).then(r => r.json()).then(setSummary); };
  useEffect(() => { load(); }, [year]);

  const saveCat = async () => {
    await fetch("/api/tax-categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(catForm) });
    setCatOpen(false); setCatForm({ name: "", type: "DEDUCTIBLE", description: "" }); load(); toast.success("Categoria fiscal criada");
  };

  const delCat = async (id: string) => {
    await fetch(`/api/tax-categories/${id}`, { method: "DELETE" }); load(); toast.success("Removida");
  };

  // IRPF calculator
  const brackets = summary?.brackets || [
    { min: 0, max: 2259.20, rate: 0, deduction: 0 },
    { min: 2259.21, max: 2826.65, rate: 0.075, deduction: 169.44 },
    { min: 2826.66, max: 3751.05, rate: 0.15, deduction: 381.44 },
    { min: 3751.06, max: 4664.68, rate: 0.225, deduction: 662.77 },
    { min: 4664.69, max: Infinity, rate: 0.275, deduction: 896.00 },
  ];

  const calcIRPF = (monthly: number) => {
    for (const b of brackets) {
      if (monthly <= b.max) return Math.max(0, monthly * b.rate - b.deduction);
    }
    const last = brackets[brackets.length - 1];
    return Math.max(0, monthly * last.rate - last.deduction);
  };

  const monthlyVal = parseFloat(monthlyIncome) || 0;
  const irpfMonthly = calcIRPF(monthlyVal);
  const effectiveRate = monthlyVal > 0 ? (irpfMonthly / monthlyVal) * 100 : 0;

  return (
    <PageWrapper>
      <AnimatedItem>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Receita Total ({year})</p><p className="text-2xl font-bold">{formatCurrency(summary?.totalIncome || 0)}</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Despesas Dedutíveis</p><p className="text-2xl font-bold text-green-500">{formatCurrency(summary?.totalDeductible || 0)}</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Transações Fiscais</p><p className="text-2xl font-bold">{summary?.transactions || 0}</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Categorias Fiscais</p><p className="text-2xl font-bold">{summary?.taxCategories?.length || 0}</p></CardContent></Card>
        </div>
      </AnimatedItem>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <AnimatedItem>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Resumo por Categoria</CardTitle>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                <SelectContent>{[0, 1, 2].map(i => { const y = new Date().getFullYear() - i; return <SelectItem key={y} value={String(y)}>{y}</SelectItem>; })}</SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              {summary?.byCategory && summary.byCategory.length > 0 ? (
                <div className="space-y-3">
                  {summary.byCategory.map(cat => (
                    <div key={cat.name} className="flex justify-between items-center">
                      <div><span className="font-medium">{cat.name}</span><span className="text-xs text-muted-foreground ml-2">({cat.count} transações)</span></div>
                      <span className="font-semibold">{formatCurrency(cat.total)}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-muted-foreground text-center py-4">Nenhuma transação fiscal marcada</p>}
            </CardContent>
          </Card>
        </AnimatedItem>

        <AnimatedItem>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Calculator className="w-5 h-5" />Calculadora IRPF</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div><Label>Renda Mensal (R$)</Label><Input type="number" value={monthlyIncome} onChange={e => setMonthlyIncome(e.target.value)} placeholder="Ex: 5000" /></div>
                {monthlyVal > 0 && (
                  <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                    <div className="flex justify-between"><span>IRPF Mensal</span><span className="font-bold text-red-500">{formatCurrency(irpfMonthly)}</span></div>
                    <div className="flex justify-between"><span>IRPF Anual (estimativa)</span><span className="font-bold text-red-500">{formatCurrency(irpfMonthly * 12)}</span></div>
                    <div className="flex justify-between"><span>Alíquota Efetiva</span><span className="font-bold">{effectiveRate.toFixed(2)}%</span></div>
                    <div className="flex justify-between"><span>Líquido Mensal</span><span className="font-bold text-green-500">{formatCurrency(monthlyVal - irpfMonthly)}</span></div>
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  <p className="font-semibold mb-1">Tabela IRPF 2024:</p>
                  {brackets.map((b, i) => (
                    <div key={i}>Até {b.max === Infinity ? "∞" : formatCurrency(b.max)}: {(b.rate * 100).toFixed(1)}%</div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </AnimatedItem>
      </div>

      <AnimatedItem>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Categorias Fiscais</CardTitle>
            <Dialog open={catOpen} onOpenChange={setCatOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-2" />Nova Categoria</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nova Categoria Fiscal</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Nome</Label><Input value={catForm.name} onChange={e => setCatForm({ ...catForm, name: e.target.value })} /></div>
                  <div><Label>Tipo</Label>
                    <Select value={catForm.type} onValueChange={v => setCatForm({ ...catForm, type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{Object.entries(typeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Descrição</Label><Input value={catForm.description} onChange={e => setCatForm({ ...catForm, description: e.target.value })} /></div>
                  <Button onClick={saveCat} className="w-full">Salvar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto"><Table>
              <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Tipo</TableHead><TableHead>Descrição</TableHead><TableHead></TableHead></TableRow></TableHeader>
              <TableBody>
                {summary?.taxCategories?.map(cat => (
                  <TableRow key={cat.id}>
                    <TableCell className="font-medium">{cat.name}</TableCell>
                    <TableCell><Badge className={`${typeColors[cat.type]} text-white`}>{typeLabels[cat.type]}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{cat.description}</TableCell>
                    <TableCell><Button variant="ghost" size="sm" onClick={() => delCat(cat.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button></TableCell>
                  </TableRow>
                ))}
                {(!summary?.taxCategories || summary.taxCategories.length === 0) && <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Nenhuma categoria fiscal</TableCell></TableRow>}
              </TableBody>
            </Table></div>
          </CardContent>
        </Card>
      </AnimatedItem>
    </PageWrapper>
  );
}
