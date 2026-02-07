"use client";
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { formatCurrency } from "@/lib/utils";
import { PageWrapper, AnimatedItem } from "@/components/page-wrapper";
import { Plus, Trash2, Copy, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface BudgetTemplate {
  id: string; name: string; description: string;
  items: { categoryId: string; categoryName?: string; amount: number }[];
  isDefault: boolean; isPublic: boolean; tenantId: string;
}

const PREBUILT_TEMPLATES = [
  { name: "Regra 50/30/20", description: "50% necessidades, 30% desejos, 20% poupança", items: [{ categoryName: "Moradia", amount: 30 }, { categoryName: "Alimentação", amount: 15 }, { categoryName: "Transporte", amount: 5 }, { categoryName: "Lazer", amount: 15 }, { categoryName: "Vestuário", amount: 10 }, { categoryName: "Educação", amount: 5 }, { categoryName: "Poupança", amount: 20 }] },
  { name: "Minimalista", description: "Foco em gastos essenciais e máxima economia", items: [{ categoryName: "Moradia", amount: 35 }, { categoryName: "Alimentação", amount: 20 }, { categoryName: "Transporte", amount: 10 }, { categoryName: "Saúde", amount: 5 }, { categoryName: "Poupança", amount: 30 }] },
  { name: "Família", description: "Orçamento familiar com educação e lazer", items: [{ categoryName: "Moradia", amount: 30 }, { categoryName: "Alimentação", amount: 20 }, { categoryName: "Transporte", amount: 10 }, { categoryName: "Educação", amount: 10 }, { categoryName: "Saúde", amount: 10 }, { categoryName: "Lazer", amount: 10 }, { categoryName: "Poupança", amount: 10 }] },
  { name: "Universitário", description: "Orçamento apertado de estudante", items: [{ categoryName: "Moradia", amount: 40 }, { categoryName: "Alimentação", amount: 25 }, { categoryName: "Transporte", amount: 15 }, { categoryName: "Material", amount: 5 }, { categoryName: "Lazer", amount: 10 }, { categoryName: "Poupança", amount: 5 }] },
];

export default function BudgetTemplatesPage() {
  const [templates, setTemplates] = useState<BudgetTemplate[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", isPublic: false });

  const load = useCallback(() => { fetch("/api/budget-templates").then(r => r.json()).then(setTemplates); }, []);
  useEffect(() => { load(); }, [load]);

  const handleCreate = async (data: { name: string; description: string; items?: unknown[]; isPublic?: boolean }) => {
    await fetch("/api/budget-templates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    load();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/budget-templates/${id}`, { method: "DELETE" });
    load();
  };

  const applyTemplate = async (template: BudgetTemplate) => {
    const month = new Date().toISOString().slice(0, 7);
    for (const item of template.items) {
      if (item.categoryId) {
        await fetch("/api/budgets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ categoryId: item.categoryId, amount: item.amount, month }) });
      }
    }
    alert("Template aplicado! Verifique a página de Orçamentos.");
  };

  return (
    <PageWrapper><AnimatedItem><h1 className="text-2xl font-bold">Templates de Orçamento</h1><p className="text-muted-foreground mb-6">Crie e aplique modelos de orçamento pré-definidos</p></AnimatedItem>
      <AnimatedItem>
        <Card className="mb-6">
          <CardHeader><CardTitle>Templates Pré-definidos</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PREBUILT_TEMPLATES.map(t => (
                <div key={t.name} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{t.name}</h3>
                    <Button size="sm" variant="outline" onClick={() => handleCreate(t)}><Copy className="h-4 w-4 mr-1" />Criar</Button>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{t.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {t.items.map(i => <Badge key={i.categoryName} variant="secondary">{i.categoryName}: {i.amount}%</Badge>)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </AnimatedItem>

      <AnimatedItem>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Meus Templates</CardTitle>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Novo</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Novo Template</DialogTitle></DialogHeader>
                <div className="grid gap-3">
                  <div><Label>Nome</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                  <div><Label>Descrição</Label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
                  <div className="flex items-center gap-2"><Switch checked={form.isPublic} onCheckedChange={v => setForm({ ...form, isPublic: v })} /><Label>Público (compartilhar com outros)</Label></div>
                  <Button onClick={() => { handleCreate(form); setOpen(false); setForm({ name: "", description: "", isPublic: false }); }}>Salvar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {templates.map(t => (
                <div key={t.id} className="p-4 border rounded-lg flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{t.name}</span>
                      {t.isPublic && <Badge variant="outline">Público</Badge>}
                      {t.isDefault && <Badge>Padrão</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{t.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => applyTemplate(t)}>Aplicar</Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(t.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
              {templates.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhum template personalizado</p>}
            </div>
          </CardContent>
        </Card>
      </AnimatedItem>
    </PageWrapper>
  );
}
