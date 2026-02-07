"use client";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, Trash2, Receipt, Copy, StickyNote, ArrowUpDown, ChevronUp, ChevronDown, X, Star, CheckSquare, Tag, Edit } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { PageWrapper, AnimatedItem } from "@/components/page-wrapper";
import { TableSkeleton } from "@/components/dashboard-skeleton";
import { Pagination } from "@/components/pagination";
import { usePagination } from "@/hooks/use-pagination";

interface Transaction {
  id: string; description: string; amount: number; type: string; date: string; notes?: string; favorite?: boolean;
  account: { id: string; name: string }; category: { id: string; name: string };
  tags?: { tag: { id: string; name: string; color: string } }[];
}
interface Account { id: string; name: string }
interface Category { id: string; name: string; type: string }

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ description: "", amount: "", type: "expense", date: new Date().toISOString().split("T")[0], accountId: "", categoryId: "", notes: "" });
  const [filterAccount, setFilterAccount] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [filterTag, setFilterTag] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterMinAmount, setFilterMinAmount] = useState("");
  const [filterMaxAmount, setFilterMaxAmount] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [tags, setTags] = useState<{ id: string; name: string; color: string }[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [notesDialog, setNotesDialog] = useState<{ id: string; notes: string } | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ description: "", amount: "", categoryId: "" });

  useEffect(() => { document.title = "Transações | Ori Financeiro"; }, []);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterAccount !== "all") params.set("accountId", filterAccount);
    if (filterCategory !== "all") params.set("categoryId", filterCategory);
    if (search) params.set("search", search);
    if (filterTag !== "all") params.set("tagId", filterTag);
    if (filterType !== "all") params.set("type", filterType);
    if (filterDateFrom) params.set("from", filterDateFrom);
    if (filterDateTo) params.set("to", filterDateTo);
    if (filterMinAmount) params.set("minAmount", filterMinAmount);
    if (filterMaxAmount) params.set("maxAmount", filterMaxAmount);
    params.set("sortBy", sortBy);
    params.set("sortOrder", sortOrder);
    fetch(`/api/transactions?${params}`).then((r) => r.json()).then((d) => { setTransactions(d); setLoading(false); });
  }, [filterAccount, filterCategory, search, filterTag, filterType, filterDateFrom, filterDateTo, filterMinAmount, filterMaxAmount, sortBy, sortOrder]);

  useEffect(() => {
    load();
    fetch("/api/accounts").then((r) => r.json()).then(setAccounts);
    fetch("/api/categories").then((r) => r.json()).then(setCategories);
    fetch("/api/tags").then((r) => r.json()).then(setTags);
  }, [load]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "n") { e.preventDefault(); setOpen(true); }
      if (e.key === "Escape") { setOpen(false); setNotesDialog(null); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const submit = async () => {
    try {
      await fetch("/api/transactions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      setOpen(false);
      setForm({ description: "", amount: "", type: "expense", date: new Date().toISOString().split("T")[0], accountId: "", categoryId: "", notes: "" });
      toast.success("Transação criada com sucesso!");
      load();
    } catch { toast.error("Erro ao criar transação"); }
  };

  const remove = async () => {
    if (!deleteId) return;
    try {
      await fetch(`/api/transactions/${deleteId}`, { method: "DELETE" });
      toast.success("Transação excluída!");
      setDeleteId(null);
      load();
    } catch { toast.error("Erro ao excluir transação"); }
  };

  const duplicate = async (id: string) => {
    try {
      await fetch(`/api/transactions/${id}?action=duplicate`, { method: "POST" });
      toast.success("Transação duplicada!");
      load();
    } catch { toast.error("Erro ao duplicar"); }
  };

  const saveNotes = async () => {
    if (!notesDialog) return;
    try {
      await fetch(`/api/transactions/${notesDialog.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notesDialog.notes }),
      });
      toast.success("Notas salvas!");
      setNotesDialog(null);
      load();
    } catch { toast.error("Erro ao salvar notas"); }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedTransactions.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(paginatedTransactions.map(t => t.id)));
  };

  const bulkDelete = async () => {
    try {
      await Promise.all(Array.from(selectedIds).map(id => fetch(`/api/transactions/${id}`, { method: "DELETE" })));
      toast.success(`${selectedIds.size} transações excluídas!`);
      setSelectedIds(new Set());
      load();
    } catch { toast.error("Erro ao excluir transações"); }
  };

  const bulkCategorize = async (categoryId: string) => {
    try {
      await Promise.all(Array.from(selectedIds).map(id =>
        fetch(`/api/transactions/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ categoryId }) })
      ));
      toast.success(`${selectedIds.size} transações atualizadas!`);
      setSelectedIds(new Set());
      load();
    } catch { toast.error("Erro ao atualizar transações"); }
  };

  const startInlineEdit = (t: Transaction) => {
    setEditingId(t.id);
    setEditForm({ description: t.description, amount: String(t.amount), categoryId: t.category.id });
  };

  const saveInlineEdit = async () => {
    if (!editingId) return;
    try {
      await fetch(`/api/transactions/${editingId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      toast.success("Transação atualizada!");
      setEditingId(null);
      load();
    } catch { toast.error("Erro ao atualizar"); }
  };

  const toggleSort = (field: string) => {
    if (sortBy === field) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    else { setSortBy(field); setSortOrder("desc"); }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-30" />;
    return sortOrder === "asc" ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />;
  };

  const filteredCats = categories.filter((c) => c.type === form.type);
  const totalFiltered = transactions.reduce((s, t) => s + (t.type === "income" ? t.amount : -t.amount), 0);
  const totalIncome = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  const { paginatedItems: paginatedTransactions, page, pageSize, total: paginatedTotal, setPage, setPageSize } = usePagination(transactions);

  const hasActiveFilters = filterAccount !== "all" || filterCategory !== "all" || filterTag !== "all" || filterType !== "all" || filterDateFrom || filterDateTo || filterMinAmount || filterMaxAmount || search;

  const clearFilters = () => {
    setFilterAccount("all"); setFilterCategory("all"); setFilterTag("all"); setFilterType("all");
    setFilterDateFrom(""); setFilterDateTo(""); setFilterMinAmount(""); setFilterMaxAmount(""); setSearch("");
  };

  return (
    <PageWrapper>
      <AnimatedItem>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Transações</h1>
            <p className="text-sm text-muted-foreground">Gerencie receitas e despesas</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-2" />Nova Transação <kbd className="ml-2 text-[10px] bg-primary-foreground/20 px-1.5 py-0.5 rounded font-mono hidden sm:inline">⌘N</kbd></Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Transação</DialogTitle>
                <DialogDescription>Adicione uma nova receita ou despesa</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2"><Label>Descrição</Label><Input placeholder="Ex: Supermercado" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                <div className="space-y-2"><Label>Valor</Label><Input type="number" placeholder="0.00" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v, categoryId: "" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="expense">Despesa</SelectItem><SelectItem value="income">Receita</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Data</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
                <div className="space-y-2">
                  <Label>Conta</Label>
                  <Select value={form.accountId} onValueChange={(v) => setForm({ ...form, accountId: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione a conta" /></SelectTrigger>
                    <SelectContent>{accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione a categoria" /></SelectTrigger>
                    <SelectContent>{filteredCats.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Notas (opcional)</Label><Input placeholder="Observações..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
                <Button onClick={submit} className="w-full" disabled={!form.description || !form.amount || !form.accountId || !form.categoryId}>Salvar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </AnimatedItem>
      <AnimatedItem><Separator /></AnimatedItem>

      {/* Summary bar */}
      <AnimatedItem>
        <div className="flex gap-4 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/50 text-sm">
            <span className="text-muted-foreground">{transactions.length} transações</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/50 text-sm">
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">+{formatCurrency(totalIncome)}</span>
            <span className="text-muted-foreground">/</span>
            <span className="text-red-600 dark:text-red-400 font-medium">-{formatCurrency(totalExpense)}</span>
            <span className="text-muted-foreground">=</span>
            <span className={`font-semibold ${totalFiltered >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>{formatCurrency(totalFiltered)}</span>
          </div>
        </div>
      </AnimatedItem>

      {/* Filters */}
      <AnimatedItem>
        <div className="space-y-3">
          <div className="flex gap-3 flex-wrap">
            <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-[200px]" />
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Todos os tipos" /></SelectTrigger>
              <SelectContent><SelectItem value="all">Todos os tipos</SelectItem><SelectItem value="income">Receita</SelectItem><SelectItem value="expense">Despesa</SelectItem></SelectContent>
            </Select>
            <Select value={filterAccount} onValueChange={setFilterAccount}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Todas as contas" /></SelectTrigger>
              <SelectContent><SelectItem value="all">Todas as contas</SelectItem>{accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Todas categorias" /></SelectTrigger>
              <SelectContent><SelectItem value="all">Todas as categorias</SelectItem>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={filterTag} onValueChange={setFilterTag}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Todas as tags" /></SelectTrigger>
              <SelectContent><SelectItem value="all">Todas as tags</SelectItem>{tags.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => setShowAdvanced(!showAdvanced)}>
              {showAdvanced ? "Menos filtros" : "Mais filtros"}
            </Button>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}><X className="h-4 w-4 mr-1" />Limpar</Button>
            )}
          </div>
          {showAdvanced && (
            <div className="flex gap-3 flex-wrap items-end">
              <div className="space-y-1">
                <Label className="text-xs">Data início</Label>
                <Input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} className="w-[160px]" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Data fim</Label>
                <Input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} className="w-[160px]" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Valor mínimo</Label>
                <Input type="number" placeholder="0" value={filterMinAmount} onChange={(e) => setFilterMinAmount(e.target.value)} className="w-[120px]" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Valor máximo</Label>
                <Input type="number" placeholder="∞" value={filterMaxAmount} onChange={(e) => setFilterMaxAmount(e.target.value)} className="w-[120px]" />
              </div>
            </div>
          )}
        </div>
      </AnimatedItem>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <AnimatedItem>
          <div className="flex items-center gap-3 p-3 rounded-lg border bg-primary/5 border-primary/20">
            <Badge variant="secondary">{selectedIds.size} selecionadas</Badge>
            <Select onValueChange={bulkCategorize}>
              <SelectTrigger className="w-[180px] h-8">
                <Tag className="h-3 w-3 mr-1" />
                <SelectValue placeholder="Categorizar..." />
              </SelectTrigger>
              <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
            <Button variant="destructive" size="sm" onClick={bulkDelete}>
              <Trash2 className="h-3.5 w-3.5 mr-1" />Excluir
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
              <X className="h-3.5 w-3.5 mr-1" />Limpar
            </Button>
          </div>
        </AnimatedItem>
      )}

      <AnimatedItem>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Lista de Transações</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <TableSkeleton rows={5} cols={6} />
            ) : transactions.length === 0 ? (
              <EmptyState icon={Receipt} title="Nenhuma transação" description="Comece registrando sua primeira receita ou despesa" actionLabel="Nova Transação" onAction={() => setOpen(true)} />
            ) : (
              <>
              {/* Mobile card layout */}
              <div className="md:hidden space-y-3">
                {paginatedTransactions.map((t) => (
                  <div key={t.id} className={`p-4 rounded-lg border hover:border-primary/50 transition-colors ${selectedIds.has(t.id) ? "bg-primary/5 border-primary/30" : ""}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <input type="checkbox" className="rounded border-border mt-1" checked={selectedIds.has(t.id)} onChange={() => toggleSelect(t.id)} />
                        <div>
                          <p className="font-medium text-sm">{t.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">{t.category.name}</Badge>
                            <span className="text-xs text-muted-foreground">{t.account.name}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{formatDate(t.date)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-semibold ${t.type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                          {t.type === "income" ? "+" : "-"}{formatCurrency(t.amount)}
                        </p>
                        <div className="flex items-center gap-0.5 mt-1 justify-end">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startInlineEdit(t)}><Edit className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => duplicate(t.id)}><Copy className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeleteId(t.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Desktop table */}
              <div className="overflow-x-auto hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-border/50 hover:bg-transparent">
                      <TableHead className="w-10">
                        <input type="checkbox" className="rounded border-border" checked={selectedIds.size === paginatedTransactions.length && paginatedTransactions.length > 0} onChange={toggleSelectAll} aria-label="Selecionar todas" />
                      </TableHead>
                      <TableHead className="text-xs text-muted-foreground font-medium cursor-pointer select-none" onClick={() => toggleSort("description")}>
                        <span className="flex items-center">Descrição<SortIcon field="description" /></span>
                      </TableHead>
                      <TableHead className="text-xs text-muted-foreground font-medium">Categoria</TableHead>
                      <TableHead className="text-xs text-muted-foreground font-medium">Conta</TableHead>
                      <TableHead className="text-xs text-muted-foreground font-medium cursor-pointer select-none" onClick={() => toggleSort("date")}>
                        <span className="flex items-center">Data<SortIcon field="date" /></span>
                      </TableHead>
                      <TableHead className="text-xs text-muted-foreground font-medium">Tipo</TableHead>
                      <TableHead className="text-xs text-muted-foreground font-medium text-right cursor-pointer select-none" onClick={() => toggleSort("amount")}>
                        <span className="flex items-center justify-end">Valor<SortIcon field="amount" /></span>
                      </TableHead>
                      <TableHead className="w-24" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedTransactions.map((t) => (
                      <TableRow key={t.id} className={`border-b border-border/50 hover:bg-muted/50 ${selectedIds.has(t.id) ? "bg-primary/5" : ""}`}>
                        <TableCell>
                          <input type="checkbox" className="rounded border-border" checked={selectedIds.has(t.id)} onChange={() => toggleSelect(t.id)} aria-label={`Selecionar ${t.description}`} />
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          {editingId === t.id ? (
                            <div className="flex items-center gap-2">
                              <Input className="h-7 text-sm w-32" value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} onKeyDown={e => e.key === "Enter" && saveInlineEdit()} />
                              <Input className="h-7 text-sm w-20" type="number" value={editForm.amount} onChange={e => setEditForm({...editForm, amount: e.target.value})} onKeyDown={e => e.key === "Enter" && saveInlineEdit()} />
                              <Button size="sm" className="h-7 text-xs" onClick={saveInlineEdit}>Salvar</Button>
                              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingId(null)}>Cancelar</Button>
                            </div>
                          ) : (
                          <div className="flex items-center gap-1.5 cursor-pointer" onDoubleClick={() => startInlineEdit(t)}>
                            {t.description}
                            {t.notes && (
                              <Tooltip>
                                <TooltipTrigger><StickyNote className="h-3 w-3 text-amber-500" /></TooltipTrigger>
                                <TooltipContent className="max-w-[200px] text-xs">{t.notes}</TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                          )}
                        </TableCell>
                        <TableCell><Badge variant="secondary" className="text-xs">{t.category.name}</Badge></TableCell>
                        <TableCell className="text-sm text-muted-foreground">{t.account.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDate(t.date)}</TableCell>
                        <TableCell><Badge variant={t.type === "income" ? "success" : "danger"} className="text-xs">{t.type === "income" ? "Receita" : "Despesa"}</Badge></TableCell>
                        <TableCell className={`text-sm font-semibold text-right ${t.type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                          {t.type === "income" ? "+" : "-"}{formatCurrency(t.amount)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-0.5">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                                  fetch("/api/favorites", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "transaction", id: t.id, favorite: !t.favorite }) }).then(() => load());
                                }}>
                                  <Star className={`h-3.5 w-3.5 ${t.favorite ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="text-xs">Favorito</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startInlineEdit(t)}>
                                  <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="text-xs">Editar</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setNotesDialog({ id: t.id, notes: t.notes || "" })}>
                                  <StickyNote className="h-3.5 w-3.5 text-muted-foreground" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="text-xs">Notas</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => duplicate(t.id)}>
                                  <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="text-xs">Duplicar</TooltipContent>
                            </Tooltip>
                            <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Excluir transação" onClick={() => setDeleteId(t.id)}>
                              <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              </>
            )}
            <Pagination total={paginatedTotal} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />
          </CardContent>
        </Card>
      </AnimatedItem>

      {/* Notes Dialog */}
      <Dialog open={!!notesDialog} onOpenChange={(o) => !o && setNotesDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notas da Transação</DialogTitle>
            <DialogDescription>Adicione observações a esta transação</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <textarea
              className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Escreva suas notas aqui..."
              value={notesDialog?.notes || ""}
              onChange={(e) => setNotesDialog(notesDialog ? { ...notesDialog, notes: e.target.value } : null)}
            />
            <Button onClick={saveNotes} className="w-full">Salvar Notas</Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} onConfirm={remove} />
    </PageWrapper>
  );
}
