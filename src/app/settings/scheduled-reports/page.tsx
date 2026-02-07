"use client";
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { PageWrapper, AnimatedItem } from "@/components/page-wrapper";
import { Plus, Trash2, FileBarChart } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface ScheduledReport {
  id: string; name: string; reportType: string; frequency: string;
  filters: Record<string, unknown>; recipients: string[]; lastSent: string | null; nextSend: string; active: boolean;
}

const REPORT_TYPES = [
  { value: "SUMMARY", label: "Resumo" }, { value: "TRANSACTIONS", label: "Transações" },
  { value: "BUDGET_STATUS", label: "Status do Orçamento" }, { value: "PNL", label: "DRE (P&L)" },
];
const FREQUENCIES = [
  { value: "DAILY", label: "Diário" }, { value: "WEEKLY", label: "Semanal" }, { value: "MONTHLY", label: "Mensal" },
];

export default function ScheduledReportsPage() {
  const [reports, setReports] = useState<ScheduledReport[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", reportType: "SUMMARY", frequency: "MONTHLY" });

  const load = useCallback(() => { fetch("/api/scheduled-reports").then(r => r.json()).then(setReports); }, []);
  useEffect(() => { load(); }, [load]);

  const handleSubmit = async () => {
    await fetch("/api/scheduled-reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setOpen(false);
    setForm({ name: "", reportType: "SUMMARY", frequency: "MONTHLY" });
    load();
  };

  const toggleActive = async (id: string, active: boolean) => {
    await fetch(`/api/scheduled-reports/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active }) });
    load();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/scheduled-reports/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <PageWrapper><AnimatedItem><h1 className="text-2xl font-bold">Relatórios Agendados</h1><p className="text-muted-foreground mb-6">Configure relatórios automáticos periódicos</p></AnimatedItem>
      <AnimatedItem>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><FileBarChart className="h-5 w-5" />Relatórios Agendados</CardTitle>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Novo</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Novo Relatório Agendado</DialogTitle></DialogHeader>
                <div className="grid gap-3">
                  <div><Label>Nome</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                  <div><Label>Tipo</Label><Select value={form.reportType} onValueChange={v => setForm({ ...form, reportType: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{REPORT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label>Frequência</Label><Select value={form.frequency} onValueChange={v => setForm({ ...form, frequency: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{FREQUENCIES.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent></Select></div>
                  <Button onClick={handleSubmit}>Salvar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Tipo</TableHead><TableHead>Frequência</TableHead><TableHead>Próximo Envio</TableHead><TableHead>Último Envio</TableHead><TableHead>Ativo</TableHead><TableHead></TableHead></TableRow></TableHeader>
              <TableBody>
                {reports.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell><Badge variant="outline">{REPORT_TYPES.find(t => t.value === r.reportType)?.label}</Badge></TableCell>
                    <TableCell>{FREQUENCIES.find(f => f.value === r.frequency)?.label}</TableCell>
                    <TableCell>{formatDate(r.nextSend)}</TableCell>
                    <TableCell>{r.lastSent ? formatDate(r.lastSent) : "—"}</TableCell>
                    <TableCell><Switch checked={r.active} onCheckedChange={v => toggleActive(r.id, v)} /></TableCell>
                    <TableCell><Button variant="ghost" size="icon" onClick={() => handleDelete(r.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                  </TableRow>
                ))}
                {reports.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhum relatório agendado</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </AnimatedItem>
    </PageWrapper>
  );
}
