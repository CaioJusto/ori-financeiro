"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PageWrapper, AnimatedItem } from "@/components/page-wrapper";
import { ArrowLeft, Copy, Edit, Trash2, User, Tag, Paperclip, History, SplitSquareVertical } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import Link from "next/link";

interface TransactionDetail {
  id: string;
  description: string;
  amount: number;
  type: string;
  date: string;
  notes?: string;
  favorite?: boolean;
  account: { id: string; name: string; color: string };
  category: { id: string; name: string; color: string };
  tags: { tag: { id: string; name: string; color: string } }[];
  splits: { id: string; categoryId: string; amount: number; description?: string }[];
  attachments: { id: string; filename: string; mimeType: string; size: number }[];
  contact?: { id: string; name: string; phone?: string; email?: string } | null;
  history: { id: string; action: string; changes: Record<string, unknown>; createdAt: string }[];
}

export default function TransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [tx, setTx] = useState<TransactionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const id = params.id as string;

  useEffect(() => {
    fetch(`/api/transactions/${id}/detail`)
      .then((r) => r.json())
      .then((d) => { setTx(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  const handleDuplicate = async () => {
    const res = await fetch(`/api/transactions/${id}?action=duplicate`, { method: "POST" });
    if (res.ok) {
      const dup = await res.json();
      toast.success("Transação duplicada");
      router.push(`/transactions/${dup.id}`);
    }
  };

  const handleDelete = async () => {
    await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    toast.success("Transação excluída");
    router.push("/transactions");
  };

  if (loading) {
    return (
      <PageWrapper>
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </PageWrapper>
    );
  }

  if (!tx) {
    return (
      <PageWrapper>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Transação não encontrada</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push("/transactions")}>
            <ArrowLeft className="h-4 w-4 mr-2" />Voltar
          </Button>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <AnimatedItem>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{tx.description}</h1>
              <p className="text-sm text-muted-foreground">Detalhes da transação</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleDuplicate}>
              <Copy className="h-4 w-4 mr-2" />Duplicar
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.push(`/transactions?edit=${id}`)}>
              <Edit className="h-4 w-4 mr-2" />Editar
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="h-4 w-4 mr-2" />Excluir
            </Button>
          </div>
        </div>
      </AnimatedItem>

      <AnimatedItem><Separator /></AnimatedItem>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Main info */}
        <AnimatedItem className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Valor</p>
                  <p className={`text-2xl font-bold ${tx.type === "income" ? "text-emerald-500" : "text-red-500"}`}>
                    {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tipo</p>
                  <Badge variant={tx.type === "income" ? "success" : "danger"} className="mt-1">
                    {tx.type === "income" ? "Receita" : "Despesa"}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Data</p>
                  <p className="text-sm font-medium mt-1">{formatDate(tx.date)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Conta</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tx.account.color }} />
                    <p className="text-sm font-medium">{tx.account.name}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Categoria</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tx.category.color }} />
                    <p className="text-sm font-medium">{tx.category.name}</p>
                  </div>
                </div>
              </div>

              {tx.notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Notas</p>
                    <p className="text-sm whitespace-pre-wrap">{tx.notes}</p>
                  </div>
                </>
              )}

              {/* Tags */}
              {tx.tags.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1"><Tag className="h-3 w-3" />Tags</p>
                    <div className="flex gap-2 flex-wrap">
                      {tx.tags.map((t) => (
                        <Badge key={t.tag.id} variant="secondary" style={{ borderColor: t.tag.color, color: t.tag.color }}>
                          {t.tag.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Splits */}
              {tx.splits.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1"><SplitSquareVertical className="h-3 w-3" />Splits</p>
                    <div className="space-y-2">
                      {tx.splits.map((s) => (
                        <div key={s.id} className="flex justify-between text-sm p-2 rounded bg-muted/30">
                          <span>{s.description || "Split"}</span>
                          <span className="font-medium">{formatCurrency(s.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Attachments */}
              {tx.attachments.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1"><Paperclip className="h-3 w-3" />Anexos</p>
                    <div className="space-y-2">
                      {tx.attachments.map((a) => (
                        <a key={a.id} href={`/api/attachments/${a.id}`} target="_blank" rel="noreferrer"
                          className="flex items-center gap-2 text-sm p-2 rounded bg-muted/30 hover:bg-muted/50 transition-colors">
                          <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{a.filename}</span>
                          <span className="text-xs text-muted-foreground ml-auto">{(a.size / 1024).toFixed(1)} KB</span>
                        </a>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </AnimatedItem>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact */}
          {tx.contact && (
            <AnimatedItem>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />Contato
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Link href="/contacts" className="text-sm font-medium text-primary hover:underline">
                    {tx.contact.name}
                  </Link>
                  {tx.contact.email && <p className="text-xs text-muted-foreground mt-1">{tx.contact.email}</p>}
                  {tx.contact.phone && <p className="text-xs text-muted-foreground">{tx.contact.phone}</p>}
                </CardContent>
              </Card>
            </AnimatedItem>
          )}

          {/* Audit History */}
          <AnimatedItem>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <History className="h-4 w-4" />Histórico de Alterações
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tx.history.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma alteração registrada</p>
                ) : (
                  <div className="space-y-3">
                    {tx.history.map((h) => (
                      <div key={h.id} className="relative pl-4 border-l-2 border-border pb-3 last:pb-0">
                        <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-primary" />
                        <p className="text-xs font-medium">
                          {h.action === "create" ? "Criada" : h.action === "update" ? "Atualizada" : "Excluída"}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(h.createdAt).toLocaleDateString("pt-BR")} às{" "}
                          {new Date(h.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                        {h.action === "update" && Object.keys(h.changes).length > 0 && (
                          <div className="mt-1 text-[11px] text-muted-foreground">
                            {Object.entries(h.changes).map(([key, val]) => (
                              <span key={key} className="block">
                                {key}: {String(val)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </AnimatedItem>
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Excluir Transação"
        description="Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita."
        onConfirm={handleDelete}
      />
    </PageWrapper>
  );
}
