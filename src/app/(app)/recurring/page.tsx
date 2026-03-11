"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useOrg } from "@/contexts/org-context";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatDate } from "@/lib/format";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  Pencil,
  Trash2,
  Pause,
  Play,
} from "lucide-react";
import type { Database } from "@/types/database";

type Category = { id: string; name: string; color?: string | null };

type RecurringTransaction =
  Database["public"]["Tables"]["recurring_transactions"]["Row"] & {
    cash_accounts: { name: string } | null;
    tags: { id: string; name: string; color: string }[];
    category: Category | null;
  };

const typeConfig = {
  income: { label: "Receita", icon: ArrowUpRight, color: "text-green-500" },
  expense: { label: "Despesa", icon: ArrowDownLeft, color: "text-red-500" },
  transfer: {
    label: "Transferencia",
    icon: ArrowLeftRight,
    color: "text-blue-500",
  },
};

const frequencyLabels: Record<string, string> = {
  daily: "Diario",
  weekly: "Semanal",
  monthly: "Mensal",
  yearly: "Anual",
};

export default function RecurringPage() {
  const { currentOrg } = useOrg();
  const [items, setItems] = useState<RecurringTransaction[]>([]);
  const [accounts, setAccounts] = useState<{ id: string; name: string }[]>([]);
  const [tags, setTags] = useState<
    { id: string; name: string; color: string }[]
  >([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RecurringTransaction | null>(
    null
  );

  const [form, setForm] = useState({
    description: "",
    amount: "",
    type: "expense" as "income" | "expense" | "transfer",
    cash_account_id: "",
    destination_account_id: "",
    frequency: "monthly" as "daily" | "weekly" | "monthly" | "yearly",
    start_date: new Date().toISOString().split("T")[0],
    end_date: "",
    selectedTags: [] as string[],
    category_id: "",
  });

  const supabase = createClient();

  useEffect(() => {
    if (!currentOrg) return;
    loadData();
  }, [currentOrg]);

  async function loadData() {
    setLoading(true);
    const orgId = currentOrg!.id;

    const [accountsRes, tagsRes, categoriesRes] = await Promise.all([
      supabase
        .from("cash_accounts")
        .select("id, name")
        .eq("organization_id", orgId),
      supabase
        .from("tags")
        .select("id, name, color")
        .eq("organization_id", orgId),
      supabase
        .from("categories")
        .select("id, name")
        .eq("organization_id", orgId)
        .order("name"),
    ]);

    setAccounts(
      (accountsRes.data as { id: string; name: string }[]) ?? []
    );
    setTags(
      (tagsRes.data as { id: string; name: string; color: string }[]) ?? []
    );
    setCategories((categoriesRes.data as unknown as Category[]) ?? []);

    if (accountsRes.data?.length && !form.cash_account_id) {
      setForm((f) => ({
        ...f,
        cash_account_id: (accountsRes.data as { id: string }[])[0].id,
      }));
    }

    // Load recurring transactions
    const { data: recRaw } = await supabase
      .from("recurring_transactions")
      .select("*, cash_accounts(name), categories(id, name)")
      .eq("organization_id", orgId)
      .order("next_date", { ascending: true });

    const recs =
      (recRaw as
        | (Database["public"]["Tables"]["recurring_transactions"]["Row"] & {
            cash_accounts: { name: string } | null;
            categories: { id: string; name: string; color?: string | null } | null;
          })[]
        | null) ?? [];

    // Load tags for all recurring transactions
    const recIds = recs.map((r) => r.id);
    const { data: recTags } = await supabase
      .from("recurring_transaction_tags")
      .select("recurring_transaction_id, tag_id")
      .in(
        "recurring_transaction_id",
        recIds.length > 0 ? recIds : ["__none__"]
      );

    const tagMap = new Map<string, string[]>();
    (
      (recTags as
        | { recurring_transaction_id: string; tag_id: string }[]
        | null) ?? []
    ).forEach((rt) => {
      const existing = tagMap.get(rt.recurring_transaction_id) ?? [];
      existing.push(rt.tag_id);
      tagMap.set(rt.recurring_transaction_id, existing);
    });

    const allTags =
      (tagsRes.data as { id: string; name: string; color: string }[]) ?? [];
    const enriched: RecurringTransaction[] = recs.map((r) => ({
      ...r,
      tags: (tagMap.get(r.id) ?? [])
        .map((tagId) => allTags.find((tag) => tag.id === tagId))
        .filter(Boolean) as { id: string; name: string; color: string }[],
      category: r.categories ?? null,
    }));

    setItems(enriched);
    setLoading(false);
  }

  function resetForm() {
    setForm({
      description: "",
      amount: "",
      type: "expense",
      cash_account_id: accounts[0]?.id ?? "",
      destination_account_id: "",
      frequency: "monthly",
      start_date: new Date().toISOString().split("T")[0],
      end_date: "",
      selectedTags: [],
      category_id: "",
    });
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!currentOrg) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const amountCents = Math.round(parseFloat(form.amount) * 100);

    const { data: recRaw } = await supabase
      .from("recurring_transactions")
      .insert({
        organization_id: currentOrg.id,
        cash_account_id: form.cash_account_id,
        destination_account_id:
          form.type === "transfer" && form.destination_account_id
            ? form.destination_account_id
            : null,
        amount: form.type === "expense" ? -amountCents : amountCents,
        type: form.type,
        description: form.description,
        category_id: form.category_id || null,
        frequency: form.frequency,
        start_date: form.start_date,
        next_date: form.start_date,
        end_date: form.end_date || null,
        created_by: user.id,
      })
      .select()
      .single();

    const rec =
      recRaw as Database["public"]["Tables"]["recurring_transactions"]["Row"] | null;

    if (rec && form.selectedTags.length > 0) {
      await supabase.from("recurring_transaction_tags").insert(
        form.selectedTags.map((tagId) => ({
          recurring_transaction_id: rec.id,
          tag_id: tagId,
        }))
      );
    }

    toast.success("Recorrência criada com sucesso!");
    resetForm();
    setDialogOpen(false);
    loadData();
  }

  function toggleTag(tagId: string) {
    setForm((f) => ({
      ...f,
      selectedTags: f.selectedTags.includes(tagId)
        ? f.selectedTags.filter((id) => id !== tagId)
        : [...f.selectedTags, tagId],
    }));
  }

  function openEdit(item: RecurringTransaction) {
    setEditingItem(item);
    setForm({
      description: item.description,
      amount: (Math.abs(item.amount) / 100).toFixed(2),
      type: item.type as "income" | "expense" | "transfer",
      cash_account_id: item.cash_account_id,
      destination_account_id: item.destination_account_id ?? "",
      frequency: item.frequency as "daily" | "weekly" | "monthly" | "yearly",
      start_date: item.start_date,
      end_date: item.end_date ?? "",
      selectedTags: item.tags.map((t) => t.id),
      category_id: item.category_id ?? "",
    });
    setEditOpen(true);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingItem) return;

    const amountCents = Math.round(parseFloat(form.amount) * 100);

    await supabase
      .from("recurring_transactions")
      .update({
        cash_account_id: form.cash_account_id,
        destination_account_id:
          form.type === "transfer" && form.destination_account_id
            ? form.destination_account_id
            : null,
        amount: form.type === "expense" ? -amountCents : amountCents,
        type: form.type,
        description: form.description,
        category_id: form.category_id || null,
        frequency: form.frequency,
        start_date: form.start_date,
        end_date: form.end_date || null,
      })
      .eq("id", editingItem.id);

    // Sync tags
    await supabase
      .from("recurring_transaction_tags")
      .delete()
      .eq("recurring_transaction_id", editingItem.id);

    if (form.selectedTags.length > 0) {
      await supabase.from("recurring_transaction_tags").insert(
        form.selectedTags.map((tagId) => ({
          recurring_transaction_id: editingItem.id,
          tag_id: tagId,
        }))
      );
    }

    toast.success("Recorrência atualizada com sucesso!");
    setEditOpen(false);
    setEditingItem(null);
    resetForm();
    loadData();
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir esta recorrência?")) return;
    await supabase.from("recurring_transaction_tags").delete().eq("recurring_transaction_id", id);
    const { error } = await supabase.from("recurring_transactions").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir recorrência", { description: error.message }); return; }
    toast.success("Recorrência excluída com sucesso!");
    loadData();
  }

  async function handleToggleActive(id: string, currentlyActive: boolean) {
    await supabase
      .from("recurring_transactions")
      .update({ is_active: !currentlyActive })
      .eq("id", id);
    loadData();
  }

  const formFields = (
    <>
      <div className="space-y-2">
        <Label>Tipo</Label>
        <div className="flex gap-2">
          {(["income", "expense", "transfer"] as const).map((type) => (
            <Button
              key={type}
              type="button"
              variant={form.type === type ? "default" : "outline"}
              size="sm"
              onClick={() => setForm((f) => ({ ...f, type }))}
            >
              {typeConfig[type].label}
            </Button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Descricao</Label>
        <Input
          value={form.description}
          onChange={(e) =>
            setForm((f) => ({ ...f, description: e.target.value }))
          }
          placeholder="Ex: Aluguel mensal"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Valor (R$)</Label>
          <Input
            type="number"
            step="0.01"
            min="0.01"
            value={form.amount}
            onChange={(e) =>
              setForm((f) => ({ ...f, amount: e.target.value }))
            }
            placeholder="0,00"
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Frequencia</Label>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            value={form.frequency}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                frequency: e.target.value as typeof form.frequency,
              }))
            }
          >
            <option value="daily">Diario</option>
            <option value="weekly">Semanal</option>
            <option value="monthly">Mensal</option>
            <option value="yearly">Anual</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Data de Inicio</Label>
          <Input
            type="date"
            value={form.start_date}
            onChange={(e) =>
              setForm((f) => ({ ...f, start_date: e.target.value }))
            }
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Data de Fim (opcional)</Label>
          <Input
            type="date"
            value={form.end_date}
            onChange={(e) =>
              setForm((f) => ({ ...f, end_date: e.target.value }))
            }
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>
          {form.type === "transfer" ? "Conta de Origem" : "Conta"}
        </Label>
        <select
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
          value={form.cash_account_id}
          onChange={(e) =>
            setForm((f) => ({ ...f, cash_account_id: e.target.value }))
          }
        >
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>
      {form.type === "transfer" && (
        <div className="space-y-2">
          <Label>Conta de Destino</Label>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            value={form.destination_account_id}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                destination_account_id: e.target.value,
              }))
            }
            required
          >
            <option value="">Selecione...</option>
            {accounts
              .filter((a) => a.id !== form.cash_account_id)
              .map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
          </select>
        </div>
      )}
      {categories.length > 0 && (
        <div className="space-y-2">
          <Label>Categoria</Label>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            value={form.category_id}
            onChange={(e) =>
              setForm((f) => ({ ...f, category_id: e.target.value }))
            }
          >
            <option value="">Sem categoria</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}
      {tags.length > 0 && (
        <div className="space-y-2">
          <Label>Tags</Label>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge
                key={tag.id}
                variant={
                  form.selectedTags.includes(tag.id) ? "default" : "outline"
                }
                className="cursor-pointer"
                style={{
                  backgroundColor: form.selectedTags.includes(tag.id)
                    ? tag.color
                    : undefined,
                }}
                onClick={() => toggleTag(tag.id)}
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Recorrencias</h1>
          <p className="text-muted-foreground">
            Gerencie transacoes recorrentes como contas, assinaturas e salarios
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Recorrencia
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Recorrencia</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              {formFields}
              <Button type="submit" className="w-full">
                Criar Recorrencia
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit dialog */}
      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setEditingItem(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Recorrencia</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            {formFields}
            <Button type="submit" className="w-full">
              Salvar Alteracoes
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Summary */}
      <div className="flex items-center gap-6 text-sm">
        <span className="text-muted-foreground">
          {items.length} recorrencia{items.length !== 1 ? "s" : ""}
        </span>
        <span className="text-muted-foreground">
          {items.filter((i) => i.is_active).length} ativa
          {items.filter((i) => i.is_active).length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Descricao</TableHead>
              <TableHead>Conta</TableHead>
              <TableHead>Frequencia</TableHead>
              <TableHead>Proxima Data</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="w-[120px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                </TableRow>
              ))
            ) : items.map((item) => {
              const config = typeConfig[item.type];
              const Icon = config.icon;
              return (
                <TableRow
                  key={item.id}
                  className={!item.is_active ? "opacity-50" : ""}
                >
                  <TableCell>
                    <Badge
                      variant={item.is_active ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {item.is_active ? "Ativa" : "Pausada"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${config.color}`} />
                      {item.description}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.cash_accounts?.name}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {frequencyLabels[item.frequency] ?? item.frequency}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {formatDate(item.next_date)}
                  </TableCell>
                  <TableCell>
                    {item.category && (
                      <Badge
                        variant="secondary"
                        style={{
                          backgroundColor:
                            (item.category.color ?? "#6366f1") + "20",
                          color: item.category.color ?? "#6366f1",
                        }}
                        className="text-xs"
                      >
                        {item.category.name}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {item.tags.map((tag) => (
                        <Badge
                          key={tag.id}
                          variant="secondary"
                          style={{
                            backgroundColor: tag.color + "20",
                            color: tag.color,
                          }}
                          className="text-xs"
                        >
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className={`text-right font-mono ${config.color}`}>
                    {formatCurrency(Math.abs(item.amount))}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={() =>
                          handleToggleActive(item.id, item.is_active)
                        }
                        title={item.is_active ? "Pausar" : "Ativar"}
                      >
                        {item.is_active ? (
                          <Pause className="h-3.5 w-3.5" />
                        ) : (
                          <Play className="h-3.5 w-3.5" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={() => openEdit(item)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-red-500"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {!loading && items.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-center py-8 text-muted-foreground"
                >
                  Nenhuma recorrencia cadastrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
