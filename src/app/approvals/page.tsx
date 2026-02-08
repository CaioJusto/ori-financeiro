"use client";
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PageWrapper, AnimatedItem } from "@/components/page-wrapper";
import { CheckCircle2, XCircle, Clock } from "lucide-react";

interface Approval {
  id: string; transactionId: string; requestedBy: string; approvedBy: string | null;
  status: string; notes: string | null; createdAt: string; updatedAt: string;
  transaction: { description: string; amount: number; type: string; date: string; category: { name: string }; account: { name: string } };
}

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [tab, setTab] = useState("PENDING");
  const [note, setNote] = useState("");

  const load = useCallback(() => { fetch("/api/approvals").then(r => r.json()).then(setApprovals); }, []);
  useEffect(() => { load(); }, [load]);

  const handleAction = async (id: string, status: string) => {
    await fetch(`/api/approvals/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, notes: note }),
    });
    setNote("");
    load();
  };

  const filtered = approvals.filter(a => a.status === tab);
  const counts = { PENDING: approvals.filter(a => a.status === "PENDING").length, APPROVED: approvals.filter(a => a.status === "APPROVED").length, REJECTED: approvals.filter(a => a.status === "REJECTED").length };

  return (
    <PageWrapper><AnimatedItem><h1 className="text-2xl font-bold">Aprovações de Despesas</h1><p className="text-muted-foreground mb-6">Gerencie solicitações de aprovação de despesas</p></AnimatedItem>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <AnimatedItem><Card><CardHeader className="pb-2 flex flex-row items-center justify-between"><CardTitle className="text-sm">Pendentes</CardTitle><Clock className="h-4 w-4 text-yellow-500" /></CardHeader><CardContent><div className="text-2xl font-bold text-yellow-600">{counts.PENDING}</div></CardContent></Card></AnimatedItem>
        <AnimatedItem><Card><CardHeader className="pb-2 flex flex-row items-center justify-between"><CardTitle className="text-sm">Aprovadas</CardTitle><CheckCircle2 className="h-4 w-4 text-green-500" /></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{counts.APPROVED}</div></CardContent></Card></AnimatedItem>
        <AnimatedItem><Card><CardHeader className="pb-2 flex flex-row items-center justify-between"><CardTitle className="text-sm">Rejeitadas</CardTitle><XCircle className="h-4 w-4 text-red-500" /></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">{counts.REJECTED}</div></CardContent></Card></AnimatedItem>
      </div>

      <AnimatedItem>
        <Card>
          <CardContent className="pt-6">
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList><TabsTrigger value="PENDING">Pendentes</TabsTrigger><TabsTrigger value="APPROVED">Aprovadas</TabsTrigger><TabsTrigger value="REJECTED">Rejeitadas</TabsTrigger></TabsList>
              <TabsContent value={tab}>
                <div className="overflow-x-auto"><Table>
                  <TableHeader><TableRow><TableHead>Transação</TableHead><TableHead>Categoria</TableHead><TableHead>Conta</TableHead><TableHead className="text-right">Valor</TableHead><TableHead>Data</TableHead><TableHead>Status</TableHead>{tab === "PENDING" && <TableHead>Ações</TableHead>}</TableRow></TableHeader>
                  <TableBody>
                    {filtered.map(a => (
                      <TableRow key={a.id}>
                        <TableCell>{a.transaction.description}</TableCell>
                        <TableCell>{a.transaction.category.name}</TableCell>
                        <TableCell>{a.transaction.account.name}</TableCell>
                        <TableCell className="text-right">{formatCurrency(a.transaction.amount)}</TableCell>
                        <TableCell>{formatDate(a.transaction.date)}</TableCell>
                        <TableCell><Badge variant={a.status === "APPROVED" ? "default" : a.status === "REJECTED" ? "destructive" : "secondary"}>{a.status === "PENDING" ? "Pendente" : a.status === "APPROVED" ? "Aprovada" : "Rejeitada"}</Badge></TableCell>
                        {tab === "PENDING" && (
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Input placeholder="Nota..." value={note} onChange={e => setNote(e.target.value)} className="w-32 h-8" />
                              <Button size="sm" variant="default" onClick={() => handleAction(a.id, "APPROVED")}><CheckCircle2 className="h-4 w-4" /></Button>
                              <Button size="sm" variant="destructive" onClick={() => handleAction(a.id, "REJECTED")}><XCircle className="h-4 w-4" /></Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                    {filtered.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhuma aprovação</TableCell></TableRow>}
                  </TableBody>
                </Table></div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </AnimatedItem>
    </PageWrapper>
  );
}
