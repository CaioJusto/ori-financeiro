"use client";

import { useEffect, useState, useMemo } from "react";
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
import { Plus, ArrowUpRight, ArrowDownLeft, ArrowLeftRight, Search, X } from "lucide-react";
import type { Database } from "@/types/database";

type Category = { id: string; name: string; icon: string | null };

type Transaction = Database["public"]["Tables"]["transactions"]["Row"] & {
  cash_accounts: { name: string } | null;
  tags: { id: string; name: string; color: string }[];
  category: Category | null;
};

const typeConfig = {
  income: { label: "Receita", icon: ArrowUpRight, color: "text-green-500" },
  expense: { label: "Despesa", icon: ArrowDownLeft, color: "text-red-500" },
  transfer: { label: "Transferencia", icon: ArrowLeftRight, color: "text-blue-500" },
};

export default function TransactionsPage() {
  const { currentOrg } = useOrg();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<{ id: string; name: string }[]>([]);
  const [tags, setTags] = useState<{ id: string; name: string; color: string }[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterAccount, setFilterAccount] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

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

  useEffect(() => {
    if (!currentOrg) return;
    loadData();
  }, [currentOrg, filterTag]);

  async function loadData() {
    const orgId = currentOrg!.id;

    const [accountsRes, tagsRes, categoriesRes] = await Promise.all([
      supabase.from("cash_accounts").select("id, name").eq("organization_id", orgId),
      supabase.from("tags").select("id, name, color").eq("organization_id", orgId),
      supabase.from("categories").select("id, name, icon").eq("organization_id", orgId).order("name"),
    ]);

    setAccounts((accountsRes.data as { id: string; name: string }[]) ?? []);
    setTags((tagsRes.data as { id: string; name: string; color: string }[]) ?? []);
    setCategories((categoriesRes.data as Category[]) ?? []);

    if (accountsRes.data?.length && !form.cash_account_id) {
      setForm((f) => ({ ...f, cash_account_id: (accountsRes.data as { id: string }[])[0].id }));
    }

    let query = supabase
      .from("transactions")
      .select("*, cash_accounts(name), categories(id, name, icon)")
      .eq("organization_id", orgId)
      .order("date", { ascending: false })
      .limit(200);

    const { data: txnsRaw } = await query;
    const txns = txnsRaw as (Database["public"]["Tables"]["transactions"]["Row"] & { cash_accounts: { name: string } | null; categories: { id: string; name: string; icon: string | null } | null })[] | null;

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

      const allTags = (tagsRes.data as { id: string; name: string; color: string }[]) ?? [];
      const enriched = txns.map((t) => ({
        ...t,
        tags: (tagMap.get(t.id) ?? [])
          .map((tagId) => allTags.find((tag) => tag.id === tagId))
          .filter(Boolean) as { id: string; name: string; color: string }[],
        category: t.categories ?? null,
      }));

      setTransactions(enriched);
    }
  }

  // Client-side filtering
  const filteredTransactions = useMemo(() => {
    let result = transactions;

    if (filterTag) {
      result = result.filter((t) => t.tags.some((tag) => tag.id === filterTag));
    }
    if (filterType) {
      result = result.filter((t) => t.type === filterType);
    }
    if (filterAccount) {
      result = result.filter((t) => t.cash_account_id === filterAccount);
    }
    if (filterCategory) {
      result = result.filter((t) => t.category_id === filterCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.description.toLowerCase().includes(q) ||
          t.cash_accounts?.name.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.name.toLowerCase().includes(q))
      );
    }
    if (dateFrom) {
      result = result.filter((t) => t.date >= dateFrom);
    }
    if (dateTo) {
      result = result.filter((t) => t.date <= dateTo);
    }

    return result;
  }, [transactions, filterTag, filterType, filterAccount, filterCategory, searchQuery, dateFrom, dateTo]);

  const hasActiveFilters = filterTag || filterType || filterAccount || filterCategory || searchQuery || dateFrom || dateTo;

  function clearFilters() {
    setFilterTag(null);
    setFilterType(null);
    setFilterAccount(null);
    setFilterCategory(null);
    setSearchQuery("");
    setDateFrom("");
    setDateTo("");
  }

  // Summary of filtered results
  const summary = useMemo(() => {
    const income = filteredTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = filteredTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    return { income, expense, net: income - expense, count: filteredTransactions.length };
  }, [filteredTransactions]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!currentOrg) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const amountCents = Math.round(parseFloat(form.amount) * 100);

    const { data: txnRaw } = await supabase
      .from("transactions")
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
        date: form.date,
        created_by: user.id,
        category_id: form.category_id || null,
      })
      .select()
      .single();
    const txn = txnRaw as Database["public"]["Tables"]["transactions"]["Row"] | null;

    if (txn && form.selectedTags.length > 0) {
      await supabase.from("transaction_tags").insert(
        form.selectedTags.map((tagId) => ({
          transaction_id: txn.id,
          tag_id: tagId,
        }))
      );
    }

    // Balance is now updated atomically by the DB trigger (sync_account_balance)

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transacoes</h1>
          <p className="text-muted-foreground">
            Registre e acompanhe suas movimentacoes
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Transacao
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Transacao</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
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
                    onChange={(e) => setForm((f) => ({ ...f, destination_account_id: e.target.value }))}
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
                    onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
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
                        variant={form.selectedTags.includes(tag.id) ? "default" : "outline"}
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
              <Button type="submit" className="w-full">
                Criar Transacao
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por descricao, conta ou tag..."
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-[150px]"
              placeholder="De"
            />
            <span className="text-muted-foreground text-sm">ate</span>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-[150px]"
              placeholder="Ate"
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
          {/* Type filters */}
          <span className="text-sm text-muted-foreground">Tipo:</span>
          <Badge
            variant={filterType === null ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setFilterType(null)}
          >
            Todos
          </Badge>
          {(["income", "expense", "transfer"] as const).map((type) => (
            <Badge
              key={type}
              variant={filterType === type ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setFilterType(type)}
            >
              {typeConfig[type].label}
            </Badge>
          ))}

          {/* Account filter */}
          {accounts.length > 1 && (
            <>
              <span className="text-sm text-muted-foreground ml-2">Conta:</span>
              <Badge
                variant={filterAccount === null ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setFilterAccount(null)}
              >
                Todas
              </Badge>
              {accounts.map((a) => (
                <Badge
                  key={a.id}
                  variant={filterAccount === a.id ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setFilterAccount(a.id)}
                >
                  {a.name}
                </Badge>
              ))}
            </>
          )}
        </div>

        {/* Category filter */}
        {categories.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Categoria:</span>
            <Badge
              variant={filterCategory === null ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setFilterCategory(null)}
            >
              Todas
            </Badge>
            {categories.map((cat) => (
              <Badge
                key={cat.id}
                variant={filterCategory === cat.id ? "default" : "outline"}
                className="cursor-pointer"
                style={{
                  backgroundColor: filterCategory === cat.id ? (cat.icon ?? "#6366f1") : undefined,
                }}
                onClick={() => setFilterCategory(cat.id)}
              >
                {cat.name}
              </Badge>
            ))}
          </div>
        )}

        {/* Tag filter */}
        {tags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Tag:</span>
            <Badge
              variant={filterTag === null ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setFilterTag(null)}
            >
              Todas
            </Badge>
            {tags.map((tag) => (
              <Badge
                key={tag.id}
                variant={filterTag === tag.id ? "default" : "outline"}
                className="cursor-pointer"
                style={{
                  backgroundColor: filterTag === tag.id ? tag.color : undefined,
                }}
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
        <span className="text-muted-foreground">{summary.count} transacoes</span>
        <span className="text-green-500">Receitas: {formatCurrency(summary.income)}</span>
        <span className="text-red-500">Despesas: {formatCurrency(summary.expense)}</span>
        <span className={summary.net >= 0 ? "text-green-500 font-medium" : "text-red-500 font-medium"}>
          Resultado: {formatCurrency(summary.net)}
        </span>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Descricao</TableHead>
              <TableHead>Conta</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead className="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.map((txn) => {
              const config = typeConfig[txn.type];
              const Icon = config.icon;
              return (
                <TableRow key={txn.id}>
                  <TableCell className="font-mono text-sm">
                    {formatDate(txn.date)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${config.color}`} />
                      {txn.description}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {txn.cash_accounts?.name}
                  </TableCell>
                  <TableCell>
                    {txn.category && (
                      <Badge
                        variant="secondary"
                        style={{
                          backgroundColor: (txn.category.icon ?? "#6366f1") + "20",
                          color: txn.category.icon ?? "#6366f1",
                        }}
                        className="text-xs"
                      >
                        {txn.category.name}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
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
                </TableRow>
              );
            })}
            {filteredTransactions.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhuma transacao encontrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
