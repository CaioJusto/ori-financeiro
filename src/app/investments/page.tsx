"use client";
import { useEffect, useState, useRef } from "react";
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
import { Plus, Trash2, Pencil, TrendingUp, TrendingDown, PieChart } from "lucide-react";
import { toast } from "sonner";

interface Investment {
  id: string; type: string; ticker: string | null; name: string; quantity: number; avgPrice: number;
  currentPrice: number; totalInvested: number; currentValue: number; profitLoss: number; lastUpdate: string;
}

const typeLabels: Record<string, string> = {
  STOCK: "Ações", FUND: "Fundos", CRYPTO: "Cripto", FIXED_INCOME: "Renda Fixa", REAL_ESTATE: "Imóveis", OTHER: "Outros",
};
const typeColors: Record<string, string> = {
  STOCK: "#3b82f6", FUND: "#22c55e", CRYPTO: "#f97316", FIXED_INCOME: "#8b5cf6", REAL_ESTATE: "#eab308", OTHER: "#6b7280",
};

const emptyForm = { name: "", ticker: "", type: "STOCK", quantity: "", avgPrice: "", currentPrice: "" };

export default function InvestmentsPage() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const load = () => { fetch("/api/investments").then(r => r.json()).then(setInvestments); };
  useEffect(() => { load(); }, []);

  const totalValue = investments.reduce((s, i) => s + i.currentValue, 0);
  const totalInvested = investments.reduce((s, i) => s + i.totalInvested, 0);
  const totalPL = totalValue - totalInvested;
  const totalReturn = totalInvested > 0 ? (totalPL / totalInvested) * 100 : 0;

  // Pie chart by type
  const byType: Record<string, number> = {};
  investments.forEach(i => { byType[i.type] = (byType[i.type] || 0) + i.currentValue; });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || totalValue === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const size = 200;
    canvas.width = size; canvas.height = size;
    ctx.clearRect(0, 0, size, size);
    let startAngle = -Math.PI / 2;
    const entries = Object.entries(byType);
    entries.forEach(([type, value]) => {
      const sliceAngle = (value / totalValue) * 2 * Math.PI;
      ctx.beginPath();
      ctx.moveTo(size / 2, size / 2);
      ctx.arc(size / 2, size / 2, size / 2 - 4, startAngle, startAngle + sliceAngle);
      ctx.fillStyle = typeColors[type] || "#6b7280";
      ctx.fill();
      startAngle += sliceAngle;
    });
    // Center hole
    ctx.beginPath(); ctx.arc(size / 2, size / 2, size / 4, 0, Math.PI * 2);
    ctx.fillStyle = "hsl(var(--card))"; ctx.fill();
  }, [investments, byType, totalValue]);

  const save = async () => {
    const url = editId ? `/api/investments/${editId}` : "/api/investments";
    const method = editId ? "PUT" : "POST";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setOpen(false); setEditId(null); setForm(emptyForm); load();
    toast.success(editId ? "Atualizado" : "Adicionado");
  };

  const del = async (id: string) => {
    await fetch(`/api/investments/${id}`, { method: "DELETE" }); load(); toast.success("Removido");
  };

  const openEdit = (inv: Investment) => {
    setEditId(inv.id); setForm({ name: inv.name, ticker: inv.ticker || "", type: inv.type, quantity: String(inv.quantity), avgPrice: String(inv.avgPrice), currentPrice: String(inv.currentPrice) }); setOpen(true);
  };

  return (
    <PageWrapper>
      <AnimatedItem>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Valor Total</p><p className="text-2xl font-bold">{formatCurrency(totalValue)}</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Investido</p><p className="text-2xl font-bold">{formatCurrency(totalInvested)}</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Lucro/Prejuízo</p><p className={`text-2xl font-bold ${totalPL >= 0 ? "text-green-500" : "text-red-500"}`}>{formatCurrency(totalPL)}</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Retorno</p><p className={`text-2xl font-bold ${totalReturn >= 0 ? "text-green-500" : "text-red-500"}`}>{totalReturn.toFixed(2)}%</p></CardContent></Card>
        </div>
      </AnimatedItem>

      <AnimatedItem>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="md:col-span-1">
            <CardHeader><CardTitle className="flex items-center gap-2"><PieChart className="w-5 h-5" />Alocação</CardTitle></CardHeader>
            <CardContent className="flex flex-col items-center">
              <canvas ref={canvasRef} className="mb-4" />
              <div className="space-y-1 w-full">
                {Object.entries(byType).map(([type, value]) => (
                  <div key={type} className="flex justify-between text-sm">
                    <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: typeColors[type] }} />{typeLabels[type]}</span>
                    <span>{totalValue > 0 ? ((value / totalValue) * 100).toFixed(1) : 0}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Ativos</CardTitle>
              <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditId(null); setForm(emptyForm); } }}>
                <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-2" />Adicionar</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>{editId ? "Editar Investimento" : "Novo Investimento"}</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div><Label>Nome</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Ticker</Label><Input value={form.ticker} onChange={e => setForm({ ...form, ticker: e.target.value })} /></div>
                      <div><Label>Tipo</Label>
                        <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{Object.entries(typeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div><Label>Quantidade</Label><Input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} /></div>
                      <div><Label>Preço Médio</Label><Input type="number" value={form.avgPrice} onChange={e => setForm({ ...form, avgPrice: e.target.value })} /></div>
                      <div><Label>Preço Atual</Label><Input type="number" value={form.currentPrice} onChange={e => setForm({ ...form, currentPrice: e.target.value })} /></div>
                    </div>
                    <Button onClick={save} className="w-full">Salvar</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto"><Table>
                <TableHeader><TableRow>
                  <TableHead>Ativo</TableHead><TableHead>Tipo</TableHead><TableHead>Qtd</TableHead><TableHead>P. Médio</TableHead>
                  <TableHead>P. Atual</TableHead><TableHead>P/L</TableHead><TableHead></TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {investments.map(inv => (
                    <TableRow key={inv.id}>
                      <TableCell><div className="font-medium">{inv.name}</div>{inv.ticker && <div className="text-xs text-muted-foreground">{inv.ticker}</div>}</TableCell>
                      <TableCell><Badge variant="outline" style={{ borderColor: typeColors[inv.type] }}>{typeLabels[inv.type]}</Badge></TableCell>
                      <TableCell>{inv.quantity}</TableCell>
                      <TableCell>{formatCurrency(inv.avgPrice)}</TableCell>
                      <TableCell>{formatCurrency(inv.currentPrice)}</TableCell>
                      <TableCell><span className={`flex items-center gap-1 ${inv.profitLoss >= 0 ? "text-green-500" : "text-red-500"}`}>
                        {inv.profitLoss >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}{formatCurrency(inv.profitLoss)}
                      </span></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(inv)}><Pencil className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => del(inv.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {investments.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum investimento</TableCell></TableRow>}
                </TableBody>
              </Table></div>
            </CardContent>
          </Card>
        </div>
      </AnimatedItem>
    </PageWrapper>
  );
}
