"use client";

import { useEffect, useState, useCallback } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useOrg } from "@/contexts/org-context";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatDate } from "@/lib/format";
import { toast } from "sonner";
import {
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  Search,
  X,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Download,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Receipt,
} from "lucide-react";
import type { Database } from "@/types/database";

// ─── Types ────────────────────────────────────────────────────────────────────

type Category = { id: string; name: string; color?: string | null };

type Transaction = Database["public"]["Tables"]["transactions"]["Row"] & {
  cash_accounts: { name: string } | null;
  tags: { id: string; name: string; color: string }[];
  category: Category | null;
};

type SortField = "date" | "description" | "amount";
type SortDir = "asc" | "desc";

const typeConfig = {
  income: { label: "Receita", icon: ArrowUpRight, color: "text-green-500" },
  expense: { label: "Despesa", icon: ArrowDownLeft, color: "text-red-500" },
  transfer: { label: "Transferência", icon: ArrowLeftRight, color: "text-blue-500" },
};

const PAGE_SIZE = 50;

// ─── Sort icon helper ─────────────────────────────────────────────────────────

function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField; sortDir: SortDir }) {
  if (sortField !== field) return <ChevronsUpDown className="ml-1 h-3 w-3 inline text-muted-foreground" />;
  return sortDir === "asc"
    ? <ChevronUp className="ml-1 h-3 w-3 inline text-foreground" />
    : <ChevronDown className="ml-1 h-3 w-3 inline text-foreground" />;
}

// ─── CSV helper ───────────────────────────────────────────────────────────────

function exportToCsv(transactions: Transaction[]) {
  const header = ["Data", "Descrição", "Tipo", "Conta", "Categoria", "Tags", "Valor (R$)"];
  const rows = transactions.map((t) => [
    t.date,
    `"${t.description.replace(/"/g, '""')}"`,
    typeConfig[t.type as keyof typeof typeConfig]?.label ?? t.type,
    t.cash_accounts?.name ?? "",
    t.category?.name ?? "",
    t.tags.map((tag) => tag.name).join("; "),
    (Math.abs(t.amount) / 100).toFixed(2).replace(".", ","),
  ]);

  const csvContent = [header.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `transacoes-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TransactionsPage() {
  const { currentOrg } = useOrg();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [accounts, setAccounts] = useState<{ id: string; name: string }[]>([]);
  const [tags, setTags] = useState<{ id: string; name: string; color: string }[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingTxn, setEditingTxn] = useState<Transaction | null>(null);

  // Filters
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterAccount, setFilterAccount] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Sorting
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Form state
  const [form, setForm] = useState({
    description: "",
    amount: "",
    type: "expense" as "income" | "expense" | "transfer",
    cash_account_id: "",
    destination_account_id: "",
    date: new Date().toISOString().split("T")[0],
    selectedTags: [] as string[],
    category_id: "",
  });

  const supabase = createClient();

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset page when filters/sort change
  useEffect(() => {
    setPage(0);
  }, [filterType, filterAccount, filterCategory, filterTag, debouncedSearch, dateFrom, dateTo, sortField, sortDir]);

  function applyFilters(
    query: ReturnType<typeof supabase.from>,
    tagTxnIds: string[] | null
  ) {
    if (filterType) query = query.eq("type", filterType);
    if (filterAccount) query = query.eq("cash_account_id", filterAccount);
    if (filterCategory) query = query.eq("category_id", filterCategory);
    if (debouncedSearch.trim()) query = query.ilike("description", `%${debouncedSearch.trim()}%`);
    if (dateFrom) query = query.gte("date", dateFrom);
    if (dateTo) query = query.lte("date", dateTo);
    if (tagTxnIds !== null) {
      query = query.in("id", tagTxnIds.length > 0 ? tagTxnIds : ["__none__"]);
    }
    return query;
  }

  const loadData = useCallback(async () => {
    if (!currentOrg) return;
    setLoading(true);
    const orgId = currentOrg.id;

    const [accountsRes, tagsRes, categoriesRes] = await Promise.all([
      supabase.from("cash_accounts").select("id, name").eq("organization_id", orgId),
      supabase.from("tags").select("id, name, color").eq("organization_id", orgId),
      supabase.from("categories").select("id, name").eq("organization_id", orgId).order("name"),
    ]);

    const freshAccounts = (accountsRes.data as { id: string; name: string }[]) ?? [];
    const freshTags = (tagsRes.data as { id: string; name: string; color: string }[]) ?? [];
    const freshCategories = (categoriesRes.data as unknown as Category[]) ?? [];

    setAccounts(freshAccounts);
    setTags(freshTags);
    setCategories(freshCategories);

    setForm((f) => ({
      ...f,
      cash_account_id: f.cash_account_id || (freshAccounts[0]?.id ?? ""),
    }));

    // Tag filter: get matching transaction IDs first
    let tagTxnIds: string[] | null = null;
    if (filterTag) {
      const { data: tagMatches } = await supabase
        .from("transaction_tags")
        .select("transaction_id")
        .eq("tag_id", filterTag);
      tagTxnIds = (tagMatches as { transaction_id: string }[] | null)?.map((t) => t.transaction_id) ?? [];
    }

    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    // Count
    let countQuery = supabase
      .from("transactions")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", orgId);
    countQuery = applyFilters(countQuery, tagTxnIds);
    const { count } = await countQuery;
    setTotalCount(count ?? 0);

    // Data with sort
    let dataQuery = supabase
      .from("transactions")
      .select("*, cash_accounts(name), categories(id, name)")
      .eq("organization_id", orgId)
      .order(sortField === "amount" ? "amount" : sortField, { ascending: sortDir === "asc" })
      .range(from, to);
    dataQuery = applyFilters(dataQuery, tagTxnIds);

    const { data: txnsRaw } = await dataQuery;
    const txns = txnsRaw as (Database["public"]["Tables"]["transactions"]["Row"] & {
      cash_accounts: { name: string } | null;
      categories: { id: string; name: string; color?: string | null } | null;
    })[] | null;

    if (txns) {
      const txnIds = txns.map((t) => t.id);
      const { data: txnTags } = await supabase
        .from("transaction_tags")
        .select("transaction_id, tag_id")
        .in("transaction_id", txnIds.length > 0 ? txnIds : ["__none__"]);

      const tagMap = new Map<string, string[]>();
      ((txnTags as { transaction_id: string; tag_id: string }[]) ?? []).forEach((tt) => {
        const existing = tagMap.get(tt.transaction_id) ?? [];
        existing.push(tt.tag_id);
        tagMap.set(tt.transaction_id, existing);
      });

      const enriched = txns.map((t) => ({
        ...t,
        tags: (tagMap.get(t.id) ?? [])
          .map((tagId) => freshTags.find((tag) => tag.id === tagId))
          .filter(Boolean) as { id: string; name: string; color: string }[],
        category: t.categories ?? null,
      }));

      setTransactions(enriched);
    } else {
      setTransactions([]);
    }

    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentOrg, filterType, filterAccount, filterCategory, filterTag, debouncedSearch, dateFrom, dateTo, page, sortField, sortDir]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const hasActiveFilters = filterTag || filterType || filterAccount || filterCategory || searchQuery || dateFrom || dateTo;

  function clearFilters() {
    setFilterTag(null);
    setFilterType(null);
    setFilterAccount(null);
    setFilterCategory(null);
    setSearchQuery("");
    setDateFrom("");
    setDateTo("");
    setPage(0);
  }

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  }

  const summary = (() => {
    const income = transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
    const expense = transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + Math.abs(t.amount), 0);
    return { income, expense, net: income - expense };
  })();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!currentOrg) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const amountCents = Math.round(parseFloat(form.amount) * 100);

    const insertPayload = {
      organization_id: currentOrg.id,
      cash_account_id: form.cash_account_id,
      amount: form.type === "expense" ? -amountCents : amountCents,
      type: form.type,
      description: form.description,
      date: form.date,
      created_by: user.id,
      category_id: form.category_id || null,
      ...(form.type === "transfer" && form.destination_account_id
        ? { destination_account_id: form.destination_account_id }
        : {}),
    };

    const { data: txnRaw, error } = await supabase
      .from("transactions")
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      toast.error("Erro ao criar transação", { description: error.message });
      return;
    }

    const txn = txnRaw as Database["public"]["Tables"]["transactions"]["Row"] | null;

    if (txn && form.selectedTags.length > 0) {
      await supabase.from("transaction_tags").insert(
        form.selectedTags.map((tagId) => ({ transaction_id: txn.id, tag_id: tagId }))
      );
    }

    toast.success("Transação criada com sucesso!");

    setForm({
      description: "",
      amount: "",
      type: "expense",
      cash_account_id: accounts[0]?.id ?? "",
      destination_account_id: "",
      date: new Date().toISOString().split("T")[0],
      selectedTags: [],
      category_id: "",
    });
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

  function openEdit(txn: Transaction) {
    setEditingTxn(txn);
    setForm({
      description: txn.description,
      amount: (Math.abs(txn.amount) / 100).toFixed(2),
      type: txn.type as "income" | "expense" | "transfer",
      cash_account_id: txn.cash_account_id,
      destination_account_id: txn.destination_account_id ?? "",
      date: txn.date,
      selectedTags: txn.tags.map((t) => t.id),
      category_id: txn.category_id ?? "",
    });
    setEditOpen(true);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingTxn) return;

    const amountCents = Math.round(parseFloat(form.amount) * 100);

    const { error } = await supabase
      .from("transactions")
      .update({
        cash_account_id: form.cash_account_id,
        amount: form.type === "expense" ? -amountCents : amountCents,
        type: form.type,
        description: form.description,
        date: form.date,
        category_id: form.category_id || null,
      })
      .eq("id", editingTxn.id);

    if (error) {
      toast.error("Erro ao editar transação", { description: error.message });
      return;
    }

    await supabase.from("transaction_tags").delete().eq("transaction_id", editingTxn.id);

    if (form.selectedTags.length > 0) {
      await supabase.from("transaction_tags").insert(
        form.selectedTags.map((tagId) => ({ transaction_id: editingTxn.id, tag_id: tagId }))
      );
    }

    toast.success("Transação atualizada com sucesso!");

    setEditOpen(false);
    setEditingTxn(null);
    setForm({
      description: "",
      amount: "",
      type: "expense",
      cash_account_id: accounts[0]?.id ?? "",
      destination_account_id: "",
      date: new Date().toISOString().split("T")[0],
      selectedTags: [],
      category_id: "",
    });
    loadData();
  }

  async function handleDelete(txnId: string) {
    if (!confirm("Tem certeza que deseja excluir esta transação?")) return;

    await supabase.from("transaction_tags").delete().eq("transaction_id", txnId);
    const { error } = await supabase.from("transactions").delete().eq("id", txnId);

    if (error) {
      toast.error("Erro ao excluir transação", { description: error.message });
      return;
    }

    toast.success("Transação excluída com sucesso!");
    loadData();
  }

  function handleExportCsv() {
    if (transactions.length === 0) {
      toast.warning("Nenhuma transação para exportar");
      return;
    }
    exportToCsv(transactions);
    toast.success(`${transactions.length} transações exportadas`);
  }

  // ─── Transaction Form (shared between create/edit) ───────────────────────────

  function TransactionForm({ onSubmit, submitLabel }: { onSubmit: (e: React.FormEvent) => Promise<void>; submitLabel: string }) {
    return (
      <form onSubmit={onSubmit} className="space-y-4">
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
          <Label>Descrição</Label>
          <Input
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Ex: Pagamento fornecedor"
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
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              placeholder="0,00"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Data</Label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>{form.type === "transfer" ? "Conta de Origem" : "Conta"}</Label>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            value={form.cash_account_id}
            onChange={(e) => setForm((f) => ({ ...f, cash_account_id: e.target.value }))}
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
        {form.type === "transfer" && (
          <div className="space-y-2">
            <Label>Conta de Destino</Label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              value={form.destination_account_id}
              onChange={(e) => setForm((f) => ({ ...f, destination_account_id: e.target.value }))}
              required
            >
              <option value="">Selecione...</option>
              {accounts.filter((a) => a.id !== form.cash_account_id).map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
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
              onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
            >
              <option value="">Sem categoria</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
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
                  variant={form.selectedTags.includes(tag.id) ? "default" : "outline"}
                  className="cursor-pointer"
                  style={{ backgroundColor: form.selectedTags.includes(tag.id) ? tag.color : undefined }}
                  onClick={() => toggleTag(tag.id)}
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          </div>
        )}
        <Button type="submit" className="w-full">{submitLabel}</Button>
      </form>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transações</h1>
          <p className="text-muted-foreground">Registre e acompanhe suas movimentações</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCsv}>
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger render={<Button />}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Transação
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Transação</DialogTitle>
              </DialogHeader>
              <TransactionForm onSubmit={handleCreate} submitLabel="Criar Transação" />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={(open) => { setEditOpen(open); if (!open) setEditingTxn(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Transação</DialogTitle>
          </DialogHeader>
          <TransactionForm onSubmit={handleEdit} submitLabel="Salvar Alterações" />
        </DialogContent>
      </Dialog>

      {/* Search and filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por descrição..."
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-[150px]"
            />
            <span className="text-muted-foreground text-sm">até</span>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-[150px]"
            />
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="mr-1 h-3 w-3" />
              Limpar
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Tipo:</span>
          <Badge variant={filterType === null ? "default" : "outline"} className="cursor-pointer" onClick={() => setFilterType(null)}>Todos</Badge>
          {(["income", "expense", "transfer"] as const).map((type) => (
            <Badge key={type} variant={filterType === type ? "default" : "outline"} className="cursor-pointer" onClick={() => setFilterType(type)}>
              {typeConfig[type].label}
            </Badge>
          ))}

          {accounts.length > 1 && (
            <>
              <span className="text-sm text-muted-foreground ml-2">Conta:</span>
              <Badge variant={filterAccount === null ? "default" : "outline"} className="cursor-pointer" onClick={() => setFilterAccount(null)}>Todas</Badge>
              {accounts.map((a) => (
                <Badge key={a.id} variant={filterAccount === a.id ? "default" : "outline"} className="cursor-pointer" onClick={() => setFilterAccount(a.id)}>
                  {a.name}
                </Badge>
              ))}
            </>
          )}
        </div>

        {categories.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Categoria:</span>
            <Badge variant={filterCategory === null ? "default" : "outline"} className="cursor-pointer" onClick={() => setFilterCategory(null)}>Todas</Badge>
            {categories.map((cat) => (
              <Badge
                key={cat.id}
                variant={filterCategory === cat.id ? "default" : "outline"}
                className="cursor-pointer"
                style={{ backgroundColor: filterCategory === cat.id ? (cat.color ?? "#6366f1") : undefined }}
                onClick={() => setFilterCategory(cat.id)}
              >
                {cat.name}
              </Badge>
            ))}
          </div>
        )}

        {tags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Tag:</span>
            <Badge variant={filterTag === null ? "default" : "outline"} className="cursor-pointer" onClick={() => setFilterTag(null)}>Todas</Badge>
            {tags.map((tag) => (
              <Badge
                key={tag.id}
                variant={filterTag === tag.id ? "default" : "outline"}
                className="cursor-pointer"
                style={{ backgroundColor: filterTag === tag.id ? tag.color : undefined }}
                onClick={() => setFilterTag(tag.id)}
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Summary bar */}
      <div className="flex items-center gap-6 text-sm">
        <span className="text-muted-foreground">
          {totalCount} transações{totalCount > PAGE_SIZE ? ` (página ${page + 1} de ${Math.ceil(totalCount / PAGE_SIZE)})` : ""}
        </span>
        <span className="text-green-500">Receitas: {formatCurrency(summary.income)}</span>
        <span className="text-red-500">Despesas: {formatCurrency(summary.expense)}</span>
        <span className={summary.net >= 0 ? "text-green-500 font-medium" : "text-red-500 font-medium"}>
          Resultado: {formatCurrency(summary.net)}
        </span>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer select-none hover:text-foreground"
                onClick={() => handleSort("date")}
              >
                Data <SortIcon field="date" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead
                className="cursor-pointer select-none hover:text-foreground"
                onClick={() => handleSort("description")}
              >
                Descrição <SortIcon field="description" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead>Conta</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead
                className="text-right cursor-pointer select-none hover:text-foreground"
                onClick={() => handleSort("amount")}
              >
                Valor <SortIcon field="amount" sortField={sortField} sortDir={sortDir} />
              </TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                </TableRow>
              ))
            ) : transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
                    <Receipt className="h-12 w-12 text-muted-foreground/30" />
                    <div>
                      <p className="text-sm font-medium">
                        {hasActiveFilters ? "Nenhuma transação encontrada com esses filtros" : "Nenhuma transação ainda"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {hasActiveFilters
                          ? "Tente ajustar ou limpar os filtros"
                          : "Clique em \"Nova Transação\" para começar"}
                      </p>
                    </div>
                    {hasActiveFilters ? (
                      <Button variant="outline" size="sm" onClick={clearFilters}>
                        <X className="mr-1 h-3 w-3" />
                        Limpar filtros
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => setDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Nova Transação
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((txn) => {
                const config = typeConfig[txn.type as keyof typeof typeConfig];
                const Icon = config.icon;
                return (
                  <TableRow key={txn.id}>
                    <TableCell className="font-mono text-sm">{formatDate(txn.date)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 flex-shrink-0 ${config.color}`} />
                        {txn.description}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{txn.cash_accounts?.name}</TableCell>
                    <TableCell>
                      {txn.category && (
                        <Badge
                          variant="secondary"
                          style={{
                            backgroundColor: (txn.category.color ?? "#6366f1") + "20",
                            color: txn.category.color ?? "#6366f1",
                          }}
                          className="text-xs"
                        >
                          {txn.category.name}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {txn.tags.map((tag) => (
                          <Badge
                            key={tag.id}
                            variant="secondary"
                            style={{ backgroundColor: tag.color + "20", color: tag.color }}
                            className="text-xs"
                          >
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className={`text-right font-mono ${config.color}`}>
                      {formatCurrency(Math.abs(txn.amount))}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() => openEdit(txn)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-red-500"
                          onClick={() => handleDelete(txn.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalCount > PAGE_SIZE && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{totalCount} transações no total</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
              Página {page + 1} de {Math.ceil(totalCount / PAGE_SIZE)}
            </span>
            <Button variant="outline" size="sm" disabled={(page + 1) * PAGE_SIZE >= totalCount} onClick={() => setPage((p) => p + 1)}>
              Próximo
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
