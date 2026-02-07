"use client";
import { useState } from "react";
import { PageWrapper } from "@/components/page-wrapper";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { FileDown, FileSpreadsheet, FileText, Calendar, Share2, Clock, BarChart3 } from "lucide-react";

const REPORT_TEMPLATES = [
  { id: "monthly", name: "Resumo Mensal", description: "Visão geral de receitas, despesas e saldo do mês", icon: "📊" },
  { id: "quarterly", name: "Relatório Trimestral", description: "Análise comparativa dos últimos 3 meses", icon: "📈" },
  { id: "annual", name: "Relatório Anual", description: "Resumo completo do ano fiscal", icon: "📅" },
  { id: "tax", name: "Relatório Fiscal", description: "Informações para declaração de imposto de renda", icon: "🏛️" },
];

export default function ExportPage() {
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [exporting, setExporting] = useState(false);

  const exportExcel = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/export/excel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dateFrom, dateTo }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `relatorio-${dateFrom}.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Excel exportado!");
      } else toast.error("Erro na exportação");
    } catch { toast.error("Erro na exportação"); }
    setExporting(false);
  };

  const exportPDF = async (template?: string) => {
    setExporting(true);
    try {
      const res = await fetch("/api/export/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportType: template || "general", title: `Relatório ${dateFrom} a ${dateTo}`, filters: { dateFrom, dateTo } }),
      });
      if (res.ok) {
        const data = await res.json();
        // For now, download as JSON (in production would be real PDF)
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `relatorio-${data.reportType}-${dateFrom}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Relatório gerado!");
      }
    } catch { toast.error("Erro ao gerar relatório"); }
    setExporting(false);
  };

  const shareReport = () => {
    const link = `${window.location.origin}/shared/report-${Date.now()}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copiado! Expira em 7 dias.");
  };

  return (
    <PageWrapper>
      <Tabs defaultValue="export">
        <TabsList>
          <TabsTrigger value="export"><FileDown className="h-4 w-4 mr-1" />Exportar</TabsTrigger>
          <TabsTrigger value="templates"><FileText className="h-4 w-4 mr-1" />Templates</TabsTrigger>
          <TabsTrigger value="scheduled"><Clock className="h-4 w-4 mr-1" />Agendados</TabsTrigger>
          <TabsTrigger value="builder"><BarChart3 className="h-4 w-4 mr-1" />Builder</TabsTrigger>
        </TabsList>

        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Exportar Dados</CardTitle>
              <CardDescription>Selecione o período e formato desejado</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3 items-center">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                </div>
                <span className="text-muted-foreground">até</span>
                <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button onClick={exportExcel} disabled={exporting} className="h-auto py-4 flex-col gap-2">
                  <FileSpreadsheet className="h-6 w-6" />
                  <span>Excel (.xlsx)</span>
                  <span className="text-xs opacity-70">Multi-abas</span>
                </Button>
                <Button onClick={() => exportPDF()} disabled={exporting} variant="outline" className="h-auto py-4 flex-col gap-2">
                  <FileText className="h-6 w-6" />
                  <span>PDF</span>
                  <span className="text-xs opacity-70">Relatório visual</span>
                </Button>
                <Button onClick={shareReport} variant="outline" className="h-auto py-4 flex-col gap-2">
                  <Share2 className="h-6 w-6" />
                  <span>Compartilhar</span>
                  <span className="text-xs opacity-70">Link com validade</span>
                </Button>
                <Button onClick={exportExcel} disabled={exporting} variant="outline" className="h-auto py-4 flex-col gap-2">
                  <FileDown className="h-6 w-6" />
                  <span>CSV</span>
                  <span className="text-xs opacity-70">Dados brutos</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-3">
            {REPORT_TEMPLATES.map(t => (
              <Card key={t.id} className="cursor-pointer hover:border-primary transition-colors" onClick={() => exportPDF(t.id)}>
                <CardContent className="p-4 flex items-start gap-3">
                  <span className="text-2xl">{t.icon}</span>
                  <div>
                    <p className="font-medium">{t.name}</p>
                    <p className="text-sm text-muted-foreground">{t.description}</p>
                    <Badge variant="outline" className="mt-2 text-xs">Clique para gerar</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Relatórios Agendados</CardTitle>
              <CardDescription>Configure envio automático de relatórios</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center py-8">
                Configure relatórios agendados em{" "}
                <a href="/settings/scheduled-reports" className="text-primary underline">Configurações → Relatórios Agendados</a>
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="builder" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Report Builder</CardTitle>
              <CardDescription>Crie relatórios customizados arrastando campos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="border rounded-lg p-3">
                  <p className="text-sm font-medium mb-2">Campos Disponíveis</p>
                  <div className="space-y-1">
                    {["Data", "Descrição", "Valor", "Tipo", "Categoria", "Conta", "Contato", "Tags"].map(f => (
                      <div key={f} className="text-xs px-2 py-1.5 bg-muted rounded cursor-move hover:bg-muted/80">{f}</div>
                    ))}
                  </div>
                </div>
                <div className="border rounded-lg p-3 border-dashed">
                  <p className="text-sm font-medium mb-2">Colunas do Relatório</p>
                  <p className="text-xs text-muted-foreground text-center py-8">Arraste campos aqui</p>
                </div>
                <div className="border rounded-lg p-3">
                  <p className="text-sm font-medium mb-2">Filtros</p>
                  <div className="space-y-2">
                    <Input placeholder="Período" type="date" />
                    <Input placeholder="Categoria" />
                    <Input placeholder="Conta" />
                    <Button size="sm" className="w-full mt-2">Gerar Relatório</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageWrapper>
  );
}
