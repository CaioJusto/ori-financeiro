"use client";
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDate } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { PageWrapper, AnimatedItem } from "@/components/page-wrapper";
import { CountUp } from "@/components/count-up";
import { Download, FileSpreadsheet, FileText, Users, CreditCard, CalendarDays, BarChart3, Share2, Printer } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Transaction {
  id: string; description: string; amount: number; type: string; date: string;
  account: { name: string }; category: { name: string };
}
interface Account { id: string; name: string }
interface Category { id: string; name: string; type: string }
interface ContactReport { name: string; income: number; expense: number; count: number }
interface CreditCardReport {
  card: { id: string; name: string; color: string; cardLimit: number; closingDay: number; dueDay: number };
  total: number; count: number; usagePercent: number;
  transactions: { id: string; description: string; amount: number; date: string; category: { name: string } }[];
}
interface AnnualReport {
  year: number;
  months: { month: string; income: number; expense: number; balance: number; count: number }[];
  totalIncome: number; totalExpense: number; balance: number; totalTransactions: number;
  topCategories: { name: string; total: number }[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 shadow-md">
      <p className="text-xs font-medium text-foreground mb-1">{label}</p>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-xs text-muted-foreground">
          <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: p.color }} />
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
};

export default function ReportsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filterAccount, setFilterAccount] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [reportTab, setReportTab] = useState("general");

  // Contact report
  const [contactData, setContactData] = useState<ContactReport[]>([]);
  // Credit card report
  const [ccData, setCcData] = useState<CreditCardReport[]>([]);
  const [ccYear, setCcYear] = useState(String(new Date().getFullYear()));
  const [ccMonth, setCcMonth] = useState(String(new Date().getMonth() + 1));
  // Annual report
  const [annualData, setAnnualData] = useState<AnnualReport | null>(null);
  const [annualYear, setAnnualYear] = useState(String(new Date().getFullYear()));

  useEffect(() => { document.title = "Relatórios | Ori Financeiro"; }, []);

  const load = useCallback(() => {
    const params = new URLSearchParams();
    if (filterAccount && filterAccount !== "all") params.set("accountId", filterAccount);
    if (filterCategory && filterCategory !== "all") params.set("categoryId", filterCategory);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    fetch(`/api/transactions?${params}`).then((r) => r.json()).then(setTransactions);
  }, [filterAccount, filterCategory, from, to]);

  useEffect(() => {
    load();
    fetch("/api/accounts").then((r) => r.json()).then(setAccounts);
    fetch("/api/categories").then((r) => r.json()).then(setCategories);
  }, [load]);

  // Load contact report
  useEffect(() => {
    if (reportTab === "contacts") {
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      fetch(`/api/reports/by-contact?${params}`).then(r => r.json()).then(setContactData);
    }
  }, [reportTab, from, to]);

  // Load credit card report
  useEffect(() => {
    if (reportTab === "credit-cards") {
      fetch(`/api/reports/by-credit-card?year=${ccYear}&month=${ccMonth}`).then(r => r.json()).then(setCcData);
    }
  }, [reportTab, ccYear, ccMonth]);

  // Load annual report
  useEffect(() => {
    if (reportTab === "annual") {
      fetch(`/api/reports/annual?year=${annualYear}`).then(r => r.json()).then(setAnnualData);
    }
  }, [reportTab, annualYear]);

  const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  const catMap = new Map<string, { name: string; income: number; expense: number }>();
  transactions.forEach((t) => {
    const e = catMap.get(t.category.name) || { name: t.category.name, income: 0, expense: 0 };
    if (t.type === "income") e.income += t.amount; else e.expense += t.amount;
    catMap.set(t.category.name, e);
  });
  const catData = Array.from(catMap.values());

  const exportExcel = (reportType: string) => {
    const params = new URLSearchParams();
    if (filterAccount && filterAccount !== "all") params.set("accountId", filterAccount);
    if (filterCategory && filterCategory !== "all") params.set("categoryId", filterCategory);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    params.set("reportType", reportType);
    window.open(`/api/export/excel?${params}`, "_blank");
  };

  const exportPdf = () => {
    window.open("/api/export/pdf", "_blank");
  };

  const shareReport = async (reportType: string) => {
    const filters: Record<string, string> = {};
    if (filterAccount && filterAccount !== "all") filters.accountId = filterAccount;
    if (filterCategory && filterCategory !== "all") filters.categoryId = filterCategory;
    if (from) filters.from = from;
    if (to) filters.to = to;
    const r = await fetch("/api/share", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reportType, filters, expiresInDays: 7 }) });
    const data = await r.json();
    const url = `${window.location.origin}${data.url}`;
    await navigator.clipboard.writeText(url);
    alert(`Link copiado!\n${url}\nExpira em 7 dias.`);
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => String(currentYear - i));
  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  return (
    <PageWrapper>
      <AnimatedItem>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Relatórios</h1>
            <p className="text-sm text-muted-foreground">Analise suas finanças com filtros avançados</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => exportExcel("general")}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />Excel
            </Button>
            <Button variant="outline" size="sm" onClick={exportPdf}>
              <FileText className="h-4 w-4 mr-2" />PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => shareReport("monthly")}>
              <Share2 className="h-4 w-4 mr-2" />Compartilhar
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-2" />Imprimir
            </Button>
          </div>
        </div>
      </AnimatedItem>
      <AnimatedItem><Separator /></AnimatedItem>

      <AnimatedItem>
        <Tabs value={reportTab} onValueChange={setReportTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general" className="flex items-center gap-1.5"><BarChart3 className="h-3.5 w-3.5" />Geral</TabsTrigger>
            <TabsTrigger value="contacts" className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />Contatos</TabsTrigger>
            <TabsTrigger value="credit-cards" className="flex items-center gap-1.5"><CreditCard className="h-3.5 w-3.5" />Cartões</TabsTrigger>
            <TabsTrigger value="annual" className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />Anual</TabsTrigger>
          </TabsList>

          {/* GENERAL TAB */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="text-sm font-medium">Filtros</CardTitle></CardHeader>
              <CardContent>
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
                  <div className="space-y-2"><Label className="text-xs text-muted-foreground">De</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
                  <div className="space-y-2"><Label className="text-xs text-muted-foreground">Até</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Conta</Label>
                    <Select value={filterAccount} onValueChange={setFilterAccount}>
                      <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                      <SelectContent><SelectItem value="all">Todas</SelectItem>{accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Categoria</Label>
                    <Select value={filterCategory} onValueChange={setFilterCategory}>
                      <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                      <SelectContent><SelectItem value="all">Todas</SelectItem>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end"><Button onClick={load} className="w-full" size="sm">Filtrar</Button></div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
              <Card className="border bg-card"><CardContent className="p-6"><p className="text-sm text-muted-foreground">Receitas</p><p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2"><CountUp value={totalIncome} /></p></CardContent></Card>
              <Card className="border bg-card"><CardContent className="p-6"><p className="text-sm text-muted-foreground">Despesas</p><p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-2"><CountUp value={totalExpense} /></p></CardContent></Card>
              <Card className="border bg-card"><CardContent className="p-6"><p className="text-sm text-muted-foreground">Balanço</p><p className={`text-2xl font-bold mt-2 ${totalIncome - totalExpense >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}><CountUp value={totalIncome - totalExpense} /></p></CardContent></Card>
            </div>

            <Tabs defaultValue="chart">
              <TabsList><TabsTrigger value="chart">Gráfico</TabsTrigger><TabsTrigger value="table">Tabela</TabsTrigger></TabsList>
              <TabsContent value="chart">
                {catData.length > 0 && (
                  <Card>
                    <CardHeader><CardTitle className="text-sm font-medium">Por Categoria</CardTitle></CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={catData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.1} />
                          <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
                          <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted))", fillOpacity: 0.3 }} />
                          <Bar dataKey="income" name="Receitas" fill="hsl(256, 77%, 60%)" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="expense" name="Despesas" fill="hsl(var(--muted-foreground))" fillOpacity={0.4} radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              <TabsContent value="table">
                <Card>
                  <CardHeader><CardTitle className="text-sm font-medium">Transações ({transactions.length})</CardTitle></CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-b border-border/50 hover:bg-transparent">
                            <TableHead className="text-xs text-muted-foreground font-medium">Descrição</TableHead>
                            <TableHead className="text-xs text-muted-foreground font-medium">Categoria</TableHead>
                            <TableHead className="text-xs text-muted-foreground font-medium">Conta</TableHead>
                            <TableHead className="text-xs text-muted-foreground font-medium">Data</TableHead>
                            <TableHead className="text-xs text-muted-foreground font-medium">Tipo</TableHead>
                            <TableHead className="text-xs text-muted-foreground font-medium text-right">Valor</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {transactions.map((t) => (
                            <TableRow key={t.id} className="border-b border-border/50 hover:bg-muted/50">
                              <TableCell className="text-sm font-medium">{t.description}</TableCell>
                              <TableCell><Badge variant="secondary" className="text-xs">{t.category.name}</Badge></TableCell>
                              <TableCell className="text-sm text-muted-foreground">{t.account.name}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">{formatDate(t.date)}</TableCell>
                              <TableCell><Badge variant={t.type === "income" ? "success" : "danger"} className="text-xs">{t.type === "income" ? "Receita" : "Despesa"}</Badge></TableCell>
                              <TableCell className={`text-sm font-semibold text-right ${t.type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                                {t.type === "income" ? "+" : "-"}{formatCurrency(t.amount)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* CONTACTS TAB */}
          <TabsContent value="contacts" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Relatório por Contato</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => exportExcel("contacts")}><Download className="h-3.5 w-3.5 mr-1.5" />Exportar</Button>
                </div>
              </CardHeader>
              <CardContent>
                {contactData.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhuma transação com contatos encontrada</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Contato</TableHead>
                        <TableHead className="text-xs text-right">Recebido</TableHead>
                        <TableHead className="text-xs text-right">Pago</TableHead>
                        <TableHead className="text-xs text-right">Saldo</TableHead>
                        <TableHead className="text-xs text-right">Transações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contactData.map((c) => (
                        <TableRow key={c.name}>
                          <TableCell className="font-medium text-sm">{c.name}</TableCell>
                          <TableCell className="text-right text-sm text-emerald-600">{formatCurrency(c.income)}</TableCell>
                          <TableCell className="text-right text-sm text-red-600">{formatCurrency(c.expense)}</TableCell>
                          <TableCell className={`text-right text-sm font-semibold ${c.income - c.expense >= 0 ? "text-emerald-600" : "text-red-600"}`}>{formatCurrency(c.income - c.expense)}</TableCell>
                          <TableCell className="text-right text-sm text-muted-foreground">{c.count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* CREDIT CARDS TAB */}
          <TabsContent value="credit-cards" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <CardTitle className="text-sm font-medium">Fatura por Cartão</CardTitle>
                  <div className="flex gap-2">
                    <Select value={ccMonth} onValueChange={setCcMonth}>
                      <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                      <SelectContent>{monthNames.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select value={ccYear} onValueChange={setCcYear}>
                      <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                      <SelectContent>{years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {ccData.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhum cartão cadastrado</p>
                ) : ccData.map(cc => (
                  <div key={cc.card.id} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cc.card.color }} />
                        <span className="font-medium text-sm">{cc.card.name}</span>
                        <Badge variant="secondary" className="text-xs">Fecha dia {cc.card.closingDay} · Vence dia {cc.card.dueDay}</Badge>
                      </div>
                      <span className="font-semibold text-sm">{formatCurrency(cc.total)}</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{cc.usagePercent.toFixed(0)}% do limite</span>
                        <span>{formatCurrency(cc.total)} / {formatCurrency(cc.card.cardLimit)}</span>
                      </div>
                      <Progress value={Math.min(cc.usagePercent, 100)} indicatorClassName={cc.usagePercent > 80 ? "bg-red-500" : "bg-[hsl(256,77%,60%)]"} />
                    </div>
                    {cc.transactions.length > 0 && (
                      <div className="pl-5 space-y-1">
                        {cc.transactions.map(t => (
                          <div key={t.id} className="flex items-center justify-between text-xs py-1">
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">{formatDate(t.date)}</span>
                              <span>{t.description}</span>
                              <Badge variant="secondary" className="text-[10px]">{t.category.name}</Badge>
                            </div>
                            <span className="text-red-600 font-medium">{formatCurrency(t.amount)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <Separator />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ANNUAL TAB */}
          <TabsContent value="annual" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Resumo Anual</CardTitle>
                  <Select value={annualYear} onValueChange={setAnnualYear}>
                    <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                    <SelectContent>{years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {annualData && (
                  <>
                    <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
                      <div><p className="text-xs text-muted-foreground">Receitas</p><p className="text-lg font-bold text-emerald-600"><CountUp value={annualData.totalIncome} /></p></div>
                      <div><p className="text-xs text-muted-foreground">Despesas</p><p className="text-lg font-bold text-red-600"><CountUp value={annualData.totalExpense} /></p></div>
                      <div><p className="text-xs text-muted-foreground">Balanço</p><p className={`text-lg font-bold ${annualData.balance >= 0 ? "text-emerald-600" : "text-red-600"}`}><CountUp value={annualData.balance} /></p></div>
                      <div><p className="text-xs text-muted-foreground">Transações</p><p className="text-lg font-bold">{annualData.totalTransactions}</p></div>
                    </div>

                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={annualData.months}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.1} />
                        <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="income" name="Receitas" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="expense" name="Despesas" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>

                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={annualData.months}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.1} />
                        <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Line type="monotone" dataKey="balance" name="Saldo" stroke="hsl(256, 77%, 60%)" strokeWidth={2} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>

                    {annualData.topCategories.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium mb-3">Top Categorias de Despesa</h3>
                        <div className="space-y-2">
                          {annualData.topCategories.map((cat, i) => (
                            <div key={cat.name} className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground w-5">{i + 1}.</span>
                                <span>{cat.name}</span>
                              </div>
                              <span className="font-medium text-red-600">{formatCurrency(cat.total)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </AnimatedItem>
    </PageWrapper>
  );
}
