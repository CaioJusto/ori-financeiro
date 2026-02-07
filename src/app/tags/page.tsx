"use client";
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Plus, Trash2, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { PageWrapper, AnimatedItem } from "@/components/page-wrapper";
import { Skeleton } from "@/components/ui/skeleton";

interface Tag { id: string; name: string; color: string }

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", color: "#6b7280" });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => { document.title = "Tags | Ori Financeiro"; }, []);

  const load = useCallback(() => { setLoading(true); fetch("/api/tags").then((r) => r.json()).then((d) => { setTags(d); setLoading(false); }); }, []);
  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    try {
      await fetch("/api/tags", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      setOpen(false); setForm({ name: "", color: "#6b7280" });
      toast.success("Tag criada!"); load();
    } catch { toast.error("Erro ao criar tag"); }
  };

  const remove = async () => {
    if (!deleteId) return;
    try {
      await fetch(`/api/tags/${deleteId}`, { method: "DELETE" });
      toast.success("Tag excluída!"); setDeleteId(null); load();
    } catch { toast.error("Erro ao excluir"); }
  };

  return (
    <PageWrapper>
      <AnimatedItem>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Tags</h1>
            <p className="text-sm text-muted-foreground">Organize transações com tags</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" />Nova Tag</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova Tag</DialogTitle><DialogDescription>Crie uma tag para organizar transações</DialogDescription></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2"><Label>Nome</Label><Input placeholder="Nome da tag" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div className="space-y-2">
                  <Label>Cor</Label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="w-10 h-10 rounded cursor-pointer border-0" />
                    <span className="text-sm text-muted-foreground">{form.color}</span>
                  </div>
                </div>
                <Button onClick={submit} className="w-full" disabled={!form.name}>Salvar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </AnimatedItem>

      <AnimatedItem>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Lista de Tags</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex flex-wrap gap-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-8 w-24" />)}</div>
            ) : tags.length === 0 ? (
              <EmptyState icon={DollarSign} title="Nenhuma tag" description="Crie tags para classificar suas transações" actionLabel="Nova Tag" onAction={() => setOpen(true)} />
            ) : (
              <div className="flex flex-wrap gap-2">
                {tags.map((t) => (
                  <div key={t.id} className="group flex items-center gap-2">
                    <Badge variant="outline" className="pl-2 pr-1 py-1.5 gap-2" style={{ borderColor: t.color }}>
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
                      <span>{t.name}</span>
                      <Button variant="ghost" size="icon" className="h-4 w-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setDeleteId(t.id)}>
                        <Trash2 className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </AnimatedItem>

      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} onConfirm={remove} />
    </PageWrapper>
  );
}
