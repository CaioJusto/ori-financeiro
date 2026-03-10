"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useOrg } from "@/contexts/org-context";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/format";
import { Plus, Wallet, Building2, Banknote, Pencil, Trash2 } from "lucide-react";
import type { Database } from "@/types/database";

type CashAccount = Database["public"]["Tables"]["cash_accounts"]["Row"];

const typeLabels: Record<string, string> = {
  personal: "Meu Caixa",
  company: "Empresa",
  cash2: "Caixa 2",
};

const typeIcons: Record<string, typeof Wallet> = {
  personal: Wallet,
  company: Building2,
  cash2: Banknote,
};

const typeColors: Record<string, string> = {
  personal: "bg-blue-500/10 text-blue-500",
  company: "bg-green-500/10 text-green-500",
  cash2: "bg-amber-500/10 text-amber-500",
};

export default function AccountsPage() {
  const { currentOrg } = useOrg();
  const [accounts, setAccounts] = useState<CashAccount[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<CashAccount | null>(null);
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<"personal" | "company" | "cash2">("personal");
  const supabase = createClient();

  useEffect(() => {
    if (!currentOrg) return;
    loadAccounts();
  }, [currentOrg]);

  async function loadAccounts() {
    const { data } = await supabase
      .from("cash_accounts")
      .select("*")
      .eq("organization_id", currentOrg!.id)
      .order("created_at");
    setAccounts((data as CashAccount[]) ?? []);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!currentOrg) return;

    await supabase.from("cash_accounts").insert({
      organization_id: currentOrg.id,
      name: formName,
      type: formType,
    });

    setFormName("");
    setFormType("personal");
    setDialogOpen(false);
    loadAccounts();
  }

  function openEdit(account: CashAccount) {
    setEditingAccount(account);
    setFormName(account.name);
    setFormType(account.type as "personal" | "company" | "cash2");
    setEditOpen(true);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingAccount) return;

    await supabase
      .from("cash_accounts")
      .update({ name: formName, type: formType })
      .eq("id", editingAccount.id);

    setEditOpen(false);
    setEditingAccount(null);
    setFormName("");
    setFormType("personal");
    loadAccounts();
  }

  async function handleDelete(account: CashAccount) {
    // Check if account has transactions
    const { count } = await supabase
      .from("transactions")
      .select("*", { count: "exact", head: true })
      .eq("cash_account_id", account.id);

    const txnCount = count ?? 0;

    let message = `Tem certeza que deseja excluir a conta "${account.name}"?`;
    if (txnCount > 0) {
      message += `\n\nAVISO: Esta conta possui ${txnCount} transacao(oes). Elas serao excluidas junto com a conta.`;
    }

    if (!confirm(message)) return;

    // Delete transaction tags for transactions in this account
    if (txnCount > 0) {
      const { data: txns } = await supabase
        .from("transactions")
        .select("id")
        .eq("cash_account_id", account.id);

      if (txns && txns.length > 0) {
        const txnIds = (txns as { id: string }[]).map((t) => t.id);
        await supabase
          .from("transaction_tags")
          .delete()
          .in("transaction_id", txnIds);
        await supabase
          .from("transactions")
          .delete()
          .eq("cash_account_id", account.id);
      }
    }

    await supabase.from("cash_accounts").delete().eq("id", account.id);
    loadAccounts();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contas</h1>
          <p className="text-muted-foreground">Gerencie suas contas de caixa</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setFormName(""); setFormType("personal"); } }}>
          <DialogTrigger render={<Button />}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Conta
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Conta</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Nome da conta"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <div className="flex gap-2">
                  {(["personal", "company", "cash2"] as const).map((type) => (
                    <Button
                      key={type}
                      type="button"
                      variant={formType === type ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFormType(type)}
                    >
                      {typeLabels[type]}
                    </Button>
                  ))}
                </div>
              </div>
              <Button type="submit" className="w-full">
                Criar
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={(open) => { setEditOpen(open); if (!open) { setEditingAccount(null); setFormName(""); setFormType("personal"); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Conta</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Nome da conta"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <div className="flex gap-2">
                {(["personal", "company", "cash2"] as const).map((type) => (
                  <Button
                    key={type}
                    type="button"
                    variant={formType === type ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFormType(type)}
                  >
                    {typeLabels[type]}
                  </Button>
                ))}
              </div>
            </div>
            <Button type="submit" className="w-full">
              Salvar
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {accounts.map((account) => {
          const Icon = typeIcons[account.type] ?? Wallet;
          return (
            <Card key={account.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {account.name}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className={typeColors[account.type]}>
                    {typeLabels[account.type]}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={() => openEdit(account)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-red-500"
                    onClick={() => handleDelete(account)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-muted p-2">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className={`text-2xl font-bold ${account.balance >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {formatCurrency(account.balance)}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {accounts.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            Nenhuma conta encontrada. Crie sua primeira conta.
          </div>
        )}
      </div>
    </div>
  );
}
