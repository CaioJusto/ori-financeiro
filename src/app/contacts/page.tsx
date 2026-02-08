"use client";
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Users, Pencil, Eye, Phone, Mail } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { PageWrapper, AnimatedItem } from "@/components/page-wrapper";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Contact { id: string; name: string; phone: string | null; email: string | null; notes: string | null; _count: { transactions: number } }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface ContactDetail extends Contact { transactions: any[] }

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [viewContact, setViewContact] = useState<ContactDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", notes: "" });

  useEffect(() => { document.title = "Contatos | Ori Financeiro"; }, []);

  const load = useCallback(() => { setLoading(true); fetch("/api/contacts").then((r) => r.json()).then((d) => { setContacts(d); setLoading(false); }); }, []);
  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    try {
      if (editId) {
        await fetch(`/api/contacts/${editId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
        toast.success("Contato atualizado!");
      } else {
        await fetch("/api/contacts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
        toast.success("Contato criado!");
      }
      setOpen(false); setEditId(null); setForm({ name: "", phone: "", email: "", notes: "" }); load();
    } catch { toast.error("Erro ao salvar"); }
  };

  const remove = async () => {
    if (!deleteId) return;
    await fetch(`/api/contacts/${deleteId}`, { method: "DELETE" });
    toast.success("Contato excluído!"); setDeleteId(null); load();
  };

  const edit = (c: Contact) => {
    setForm({ name: c.name, phone: c.phone || "", email: c.email || "", notes: c.notes || "" });
    setEditId(c.id); setOpen(true);
  };

  const view = async (id: string) => {
    const data = await fetch(`/api/contacts/${id}`).then((r) => r.json());
    setViewContact(data);
  };

  return (
    <PageWrapper>
      <AnimatedItem>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Contatos</h1>
            <p className="text-sm text-muted-foreground">Gerencie pessoas associadas às suas transações</p>
          </div>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditId(null); setForm({ name: "", phone: "", email: "", notes: "" }); } }}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" />Novo Contato</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editId ? "Editar" : "Novo"} Contato</DialogTitle><DialogDescription>Dados do contato</DialogDescription></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2"><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div className="space-y-2"><Label>Telefone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                <div className="space-y-2"><Label>Notas</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
                <Button onClick={submit} className="w-full" disabled={!form.name}>Salvar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </AnimatedItem>

      <AnimatedItem>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Lista de Contatos</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : contacts.length === 0 ? (
              <EmptyState icon={Users} title="Nenhum contato" description="Adicione contatos para associar às transações" actionLabel="Novo Contato" onAction={() => setOpen(true)} />
            ) : (
              <div className="overflow-x-auto"><Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Transações</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {c.phone && <Badge variant="outline" className="gap-1"><Phone className="h-3 w-3" />{c.phone}</Badge>}
                          {c.email && <Badge variant="outline" className="gap-1"><Mail className="h-3 w-3" />{c.email}</Badge>}
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="secondary">{c._count.transactions}</Badge></TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => view(c.id)}><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => edit(c)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(c.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table></div>
            )}
          </CardContent>
        </Card>
      </AnimatedItem>

      {/* View Contact Detail */}
      <Dialog open={!!viewContact} onOpenChange={() => setViewContact(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Histórico - {viewContact?.name}</DialogTitle><DialogDescription>Transações associadas a este contato</DialogDescription></DialogHeader>
          {viewContact && (
            <div className="space-y-4">
              <div className="flex gap-4 text-sm text-muted-foreground">
                {viewContact.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{viewContact.phone}</span>}
                {viewContact.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{viewContact.email}</span>}
              </div>
              {viewContact.transactions.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma transação associada</p>
              ) : (
                <div className="overflow-x-auto"><Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {viewContact.transactions.map((t: { id: string; description: string; amount: number; type: string; date: string; category: { name: string } }) => (
                      <TableRow key={t.id}>
                        <TableCell>{t.description}</TableCell>
                        <TableCell><Badge variant="secondary">{t.category.name}</Badge></TableCell>
                        <TableCell>{formatDate(t.date)}</TableCell>
                        <TableCell className={`text-right font-medium ${t.type === "income" ? "text-emerald-600" : "text-red-600"}`}>
                          {t.type === "income" ? "+" : "-"}{formatCurrency(t.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table></div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} onConfirm={remove} title="Excluir Contato" description="Tem certeza?" />
    </PageWrapper>
  );
}
