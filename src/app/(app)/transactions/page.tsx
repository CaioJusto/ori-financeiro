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
import { Plus, ArrowUpRight, ArrowDownLeft, ArrowLeftRight } from "lucide-react";
import type { Database } from "@/types/database";

type Transaction = Database["public"]["Tables"]["transactions"]["Row"] & {
  cash_accounts: { name: string } | null;
  tags: { id: string; name: string; color: string }[];
};

const typeConfig = {
  income: { label: "Receita", icon: ArrowUpRight, color: "text-green-500" },
  expense: { label: "Despesa", icon: ArrowDownLeft, color: "text-red-500" },
  transfer: { label: "Transferência", icon: ArrowLeftRight, color: "text-blue-500" },
};

export default function TransactionsPage() {
  const { currentOrg } = useOrg();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<{ id: string; name: string }[]>([]);
  const [tags, setTags] = useState<{ id: string; name: string; color: string }[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterTag, setFilterTag] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    description: "",
    amount: "",
    type: "expense" as "income" | "expense" | "transfer",
    cash_account_id: "",
    date: new Date().toISOString().split("T")[0],
    selectedTags: [] as string[],
  });

  const supabase = createClient();

  useEffect(() => {
    if (!currentOrg) return;
    loadData();
  }, [currentOrg, filterTag]);

  async function loadData() {
    const orgId = currentOrg!.id;

    // Load accounts and tags
    const [accountsRes, tagsRes] = await Promise.all([
      supabase.from("cash_accounts").select("id, name").eq("organization_id", orgId),
      supabase.from("tags").select("id, name, color").eq("organization_id", orgId),
    ]);

    setAccounts((accountsRes.data as { id: string; name: string }[]) ?? []);
    setTags((tagsRes.data as { id: string; name: string; color: string }[]) ?? []);

    if (accountsRes.data?.length && !form.cash_account_id) {
      setForm((f) => ({ ...f, cash_account_id: (accountsRes.data as { id: string }[])[0].id }));
    }

    // Load transactions with tags
    let query = supabase
      .from("transactions")
      .select("*, cash_accounts(name)")
      .eq("organization_id", orgId)
      .order("date", { ascending: false })
      .limit(100);

    const { data: txnsRaw } = await query;
    const txns = txnsRaw as (Database["public"]["Tables"]["transactions"]["Row"] & { cash_accounts: { name: string } | null })[] | null;

    if (txns) {
      // Load tags for each transaction
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
      }));

      if (filterTag) {
        setTransactions(enriched.filter((t) => t.tags.some((tag) => tag.id === filterTag)));
      } else {
        setTransactions(enriched);
      }
    }
  }

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
        amount: form.type === "expense" ? -amountCents : amountCents,
        type: form.type,
        description: form.description,
        date: form.date,
        created_by: user.id,
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

    // Update account balance
    if (txn) {
      const delta = form.type === "expense" ? -amountCents : amountCents;
      const { data: accountRaw } = await supabase
        .from("cash_accounts")
        .select("balance")
        .eq("id", form.cash_account_id)
        .single();
      const account = accountRaw as { balance: number } | null;

      if (account) {
        await supabase
          .from("cash_accounts")
          .update({ balance: account.balance + delta })
          .eq("id", form.cash_account_id);
      }
    }

    setForm({
      description: "",
      amount: "",
      type: "expense",
      cash_account_id: accounts[0]?.id ?? "",
      date: new Date().toISOString().split("T")[0],
      selectedTags: [],
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
          <h1 className="text-2xl font-bold tracking-tight">Transações</h1>
          <p className="text-muted-foreground">
            Registre e acompanhe suas movimentações
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Transação
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Transação</DialogTitle>
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
                <Label>Conta</Label>
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
                Criar Transação
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tag filter */}
      {tags.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filtrar por tag:</span>
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

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Conta</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead className="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((txn) => {
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
            {transactions.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Nenhuma transação encontrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
