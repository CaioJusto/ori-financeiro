"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Plus, Trash2, Tag, ChevronRight, ChevronDown, Pencil } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { PageWrapper, AnimatedItem } from "@/components/page-wrapper";
import { CardsSkeleton } from "@/components/dashboard-skeleton";

interface Category {
  id: string; name: string; type: string; color: string; icon: string;
  parentId: string | null;
  parent?: { id: string; name: string } | null;
  children?: Category[];
}

function CategoryTree({ categories, onDelete, onEdit, level = 0 }: { categories: Category[]; onDelete: (id: string) => void; onEdit: (c: Category) => void; level?: number }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-0.5">
      {categories.map(c => {
        const hasChildren = c.children && c.children.length > 0;
        const isExpanded = expanded.has(c.id);
        return (
          <div key={c.id}>
            <div
              className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-accent/50 transition-colors"
              style={{ paddingLeft: `${12 + level * 20}px` }}
            >
              <div className="flex items-center gap-2">
                {hasChildren ? (
                  <button onClick={() => toggle(c.id)} className="p-0.5 hover:bg-muted rounded">
                    {isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                  </button>
                ) : (
                  <span className="w-4" />
                )}
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                <span className="text-sm">{c.name}</span>
                {c.parentId && <Badge variant="secondary" className="text-[10px] ml-1">sub</Badge>}
              </div>
              <div className="flex items-center gap-0.5">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(c)}>
                  <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDelete(c.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </div>
            </div>
            {hasChildren && isExpanded && (
              <CategoryTree categories={c.children!} onDelete={onDelete} onEdit={onEdit} level={level + 1} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", type: "expense", color: "#6b7280", parentId: "" });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [editForm, setEditForm] = useState({ name: "", color: "#6b7280" });

  useEffect(() => { document.title = "Categorias | Ori Financeiro"; }, []);

  const load = () => { setLoading(true); fetch("/api/categories").then((r) => r.json()).then((d) => { setCategories(d); setLoading(false); }); };
  useEffect(() => { load(); }, []);

  const submit = async () => {
    try {
      await fetch("/api/categories", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, parentId: form.parentId || null }),
      });
      setOpen(false); setForm({ name: "", type: "expense", color: "#6b7280", parentId: "" });
      toast.success("Categoria criada!"); load();
    } catch { toast.error("Erro ao criar categoria"); }
  };

  const startEdit = (c: Category) => {
    setEditCat(c);
    setEditForm({ name: c.name, color: c.color });
  };

  const submitEdit = async () => {
    if (!editCat) return;
    try {
      await fetch(`/api/categories/${editCat.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editForm) });
      setEditCat(null);
      toast.success("Categoria atualizada!"); load();
    } catch { toast.error("Erro ao atualizar categoria"); }
  };

  const remove = async () => {
    if (!deleteId) return;
    try {
      await fetch(`/api/categories/${deleteId}`, { method: "DELETE" });
      toast.success("Categoria excluída!"); setDeleteId(null); load();
    } catch { toast.error("Erro ao excluir categoria"); }
  };

  // Build tree: only show root categories, children nested
  const rootCategories = categories.filter(c => !c.parentId);
  const incomeRoots = rootCategories.filter(c => c.type === "income");
  const expenseRoots = rootCategories.filter(c => c.type === "expense");

  // Get potential parents for the form (only root categories of same type)
  const parentOptions = categories.filter(c => !c.parentId && c.type === form.type);

  return (
    <PageWrapper>
      <AnimatedItem>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Categorias</h1>
            <p className="text-sm text-muted-foreground">Organize suas transações com sub-categorias</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" />Nova Categoria</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova Categoria</DialogTitle><DialogDescription>Crie uma nova categoria para organizar transações</DialogDescription></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2"><Label>Nome</Label><Input placeholder="Nome da categoria" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v, parentId: "" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="expense">Despesa</SelectItem><SelectItem value="income">Receita</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Categoria Pai (opcional)</Label>
                  <Select value={form.parentId || "none"} onValueChange={(v) => setForm({ ...form, parentId: v === "none" ? "" : v })}>
                    <SelectTrigger><SelectValue placeholder="Nenhuma (raiz)" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma (raiz)</SelectItem>
                      {parentOptions.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Cor</Label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="w-10 h-10 rounded cursor-pointer border-0" />
                    <span className="text-sm text-muted-foreground">{form.color}</span>
                  </div>
                </div>
                <Button onClick={submit} className="w-full" disabled={!form.name}>Criar Categoria</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </AnimatedItem>

      {loading ? <CardsSkeleton count={2} /> : categories.length === 0 ? (
        <EmptyState icon={Tag} title="Nenhuma categoria" description="Crie categorias para organizar suas transações" actionLabel="Nova Categoria" onAction={() => setOpen(true)} />
      ) : (
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          <AnimatedItem>
            <Card>
              <CardHeader><CardTitle className="text-sm font-medium flex items-center gap-2"><Badge variant="success">Receitas</Badge></CardTitle></CardHeader>
              <CardContent>
                {incomeRoots.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma categoria de receita</p>
                ) : (
                  <CategoryTree categories={incomeRoots} onDelete={setDeleteId} onEdit={startEdit} />
                )}
              </CardContent>
            </Card>
          </AnimatedItem>
          <AnimatedItem>
            <Card>
              <CardHeader><CardTitle className="text-sm font-medium flex items-center gap-2"><Badge variant="danger">Despesas</Badge></CardTitle></CardHeader>
              <CardContent>
                {expenseRoots.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma categoria de despesa</p>
                ) : (
                  <CategoryTree categories={expenseRoots} onDelete={setDeleteId} onEdit={startEdit} />
                )}
              </CardContent>
            </Card>
          </AnimatedItem>
        </div>
      )}

      <Dialog open={!!editCat} onOpenChange={(o) => !o && setEditCat(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Categoria</DialogTitle><DialogDescription>Altere os dados da categoria</DialogDescription></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2"><Label>Nome</Label><Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></div>
            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex items-center gap-3">
                <input type="color" value={editForm.color} onChange={(e) => setEditForm({ ...editForm, color: e.target.value })} className="w-10 h-10 rounded cursor-pointer border-0" />
                <span className="text-sm text-muted-foreground">{editForm.color}</span>
              </div>
            </div>
            <Button onClick={submitEdit} className="w-full" disabled={!editForm.name}>Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} onConfirm={remove} />
    </PageWrapper>
  );
}
