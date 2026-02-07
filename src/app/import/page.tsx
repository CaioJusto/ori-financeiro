"use client";
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { PageWrapper, AnimatedItem } from "@/components/page-wrapper";
import { toast } from "sonner";
import { Upload, FileUp, ArrowRight, ArrowLeft, Check, AlertTriangle, X, History, Undo2 } from "lucide-react";

interface Account { id: string; name: string }
interface Category { id: string; name: string }
interface ParsedRow { [key: string]: string }
interface MappingField { source: string; target: string }
interface ValidationError { row: number; field: string; message: string }
interface ImportHistoryItem { id: string; filename: string; format: string; rowCount: number; imported: number; skipped: number; errors: number; status: string; createdAt: string }

const STEPS = ["Upload", "Mapeamento", "Preview", "Duplicatas", "Confirmar"];
const TARGET_FIELDS = [
  { value: "description", label: "Descrição" },
  { value: "amount", label: "Valor" },
  { value: "date", label: "Data" },
  { value: "type", label: "Tipo (income/expense)" },
  { value: "ignore", label: "Ignorar" },
];

function parseCSV(text: string): { headers: string[]; rows: ParsedRow[] } {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return { headers: [], rows: [] };
  const sep = lines[0].includes(";") ? ";" : ",";
  const headers = lines[0].split(sep).map(h => h.trim().replace(/"/g, ""));
  const rows = lines.slice(1).map(line => {
    const values = line.split(sep).map(v => v.trim().replace(/"/g, ""));
    const row: ParsedRow = {};
    headers.forEach((h, i) => { row[h] = values[i] || ""; });
    return row;
  });
  return { headers, rows };
}

function parseOFX(text: string): { headers: string[]; rows: ParsedRow[] } {
  const rows: ParsedRow[] = [];
  const regex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const block = match[1];
    const get = (tag: string) => { const m = block.match(new RegExp(`<${tag}>([^<\\n]+)`)); return m ? m[1].trim() : ""; };
    rows.push({ date: get("DTPOSTED").slice(0, 8), amount: get("TRNAMT"), description: get("MEMO") || get("NAME"), type: parseFloat(get("TRNAMT")) >= 0 ? "income" : "expense" });
  }
  return { headers: ["date", "amount", "description", "type"], rows };
}

function parseQIF(text: string): { headers: string[]; rows: ParsedRow[] } {
  const rows: ParsedRow[] = [];
  let current: ParsedRow = {};
  text.split("\n").forEach(line => {
    line = line.trim();
    if (line === "^") { if (current.amount) rows.push(current); current = {}; }
    else if (line.startsWith("D")) current.date = line.slice(1);
    else if (line.startsWith("T")) { current.amount = line.slice(1); current.type = parseFloat(line.slice(1)) >= 0 ? "income" : "expense"; }
    else if (line.startsWith("P")) current.description = line.slice(1);
  });
  return { headers: ["date", "amount", "description", "type"], rows };
}

export default function ImportPage() {
  const [step, setStep] = useState(0);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<"CSV" | "OFX" | "QIF">("CSV");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [mapping, setMapping] = useState<MappingField[]>([]);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [duplicates, setDuplicates] = useState<number[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<ImportHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/accounts").then(r => r.json()),
      fetch("/api/categories").then(r => r.json()),
      fetch("/api/import/history").then(r => r.json()),
    ]).then(([a, c, h]) => {
      setAccounts(a.accounts || a || []);
      setCategories(c.categories || c || []);
      setHistory(h.history || []);
    });
  }, []);

  const handleFileUpload = useCallback(async (f: File) => {
    setFile(f);
    const text = await f.text();
    const ext = f.name.split(".").pop()?.toLowerCase();
    let parsed: { headers: string[]; rows: ParsedRow[] };

    if (ext === "ofx") { parsed = parseOFX(text); setFormat("OFX"); }
    else if (ext === "qif") { parsed = parseQIF(text); setFormat("QIF"); }
    else { parsed = parseCSV(text); setFormat("CSV"); }

    setHeaders(parsed.headers);
    setRows(parsed.rows);
    setMapping(parsed.headers.map(h => {
      const lower = h.toLowerCase();
      let target = "ignore";
      if (lower.includes("desc") || lower.includes("memo") || lower.includes("name")) target = "description";
      else if (lower.includes("valor") || lower.includes("amount") || lower.includes("trnamt")) target = "amount";
      else if (lower.includes("data") || lower.includes("date")) target = "date";
      else if (lower.includes("tipo") || lower.includes("type")) target = "type";
      return { source: h, target };
    }));
    setSelectedRows(new Set(parsed.rows.map((_, i) => i)));
  }, []);

  function validate() {
    const errs: ValidationError[] = [];
    const descCol = mapping.find(m => m.target === "description")?.source;
    const amountCol = mapping.find(m => m.target === "amount")?.source;
    const dateCol = mapping.find(m => m.target === "date")?.source;

    rows.forEach((row, i) => {
      if (descCol && !row[descCol]) errs.push({ row: i, field: "description", message: "Descrição vazia" });
      if (amountCol) {
        const val = parseFloat(row[amountCol]?.replace(",", ".").replace(/[^\d.-]/g, ""));
        if (isNaN(val)) errs.push({ row: i, field: "amount", message: "Valor inválido" });
      }
      if (dateCol && !row[dateCol]) errs.push({ row: i, field: "date", message: "Data vazia" });
    });
    setErrors(errs);

    // Simple duplicate detection
    const amountKey = mapping.find(m => m.target === "amount")?.source;
    const dateKey = mapping.find(m => m.target === "date")?.source;
    const dupes: number[] = [];
    if (amountKey && dateKey) {
      const seen = new Map<string, number>();
      rows.forEach((row, i) => {
        const key = `${row[amountKey]}_${row[dateKey]}`;
        if (seen.has(key)) { dupes.push(i); dupes.push(seen.get(key)!); }
        seen.set(key, i);
      });
    }
    setDuplicates([...new Set(dupes)]);
  }

  function goNext() {
    if (step === 0 && !file) { toast.error("Selecione um arquivo"); return; }
    if (step === 1) validate();
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  }

  async function handleImport() {
    if (!accountId || !categoryId) { toast.error("Selecione conta e categoria"); return; }
    setLoading(true);

    const descCol = mapping.find(m => m.target === "description")?.source;
    const amountCol = mapping.find(m => m.target === "amount")?.source;
    const dateCol = mapping.find(m => m.target === "date")?.source;
    const typeCol = mapping.find(m => m.target === "type")?.source;

    const transactions = rows
      .filter((_, i) => selectedRows.has(i))
      .filter((_, i) => !errors.some(e => e.row === i))
      .map(row => ({
        description: descCol ? row[descCol] : "Importado",
        amount: Math.abs(parseFloat((amountCol ? row[amountCol] : "0").replace(",", ".").replace(/[^\d.-]/g, ""))),
        date: dateCol ? row[dateCol] : new Date().toISOString(),
        type: typeCol ? row[typeCol] : "expense",
        accountId,
        categoryId,
      }));

    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactions, filename: file?.name, format }),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(`${data.imported || transactions.length} transações importadas!`);
        setStep(0); setFile(null); setRows([]); setHeaders([]);
      } else { toast.error("Erro na importação"); }
    } catch { toast.error("Erro de conexão"); }
    finally { setLoading(false); }
  }

  async function handleUndo(id: string) {
    const res = await fetch(`/api/import/history/${id}/undo`, { method: "POST" });
    if (res.ok) {
      setHistory(prev => prev.map(h => h.id === id ? { ...h, status: "UNDONE" } : h));
      toast.success("Importação desfeita");
    }
  }

  return (
    <PageWrapper>
      <AnimatedItem>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Importar Dados</h1>
            <p className="text-muted-foreground">Importe transações de CSV, OFX ou QIF</p>
          </div>
          <Button variant="outline" onClick={() => setShowHistory(!showHistory)}>
            <History className="h-4 w-4 mr-2" /> Histórico
          </Button>
        </div>
      </AnimatedItem>

      {showHistory ? (
        <AnimatedItem>
          <Card>
            <CardHeader><CardTitle>Histórico de Importações</CardTitle></CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Nenhuma importação realizada</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Arquivo</TableHead>
                      <TableHead>Formato</TableHead>
                      <TableHead>Importados</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map(h => (
                      <TableRow key={h.id}>
                        <TableCell className="font-medium">{h.filename}</TableCell>
                        <TableCell><Badge variant="outline">{h.format}</Badge></TableCell>
                        <TableCell>{h.imported}/{h.rowCount}</TableCell>
                        <TableCell><Badge variant={h.status === "COMPLETED" ? "default" : "secondary"}>{h.status}</Badge></TableCell>
                        <TableCell className="text-sm text-muted-foreground">{new Date(h.createdAt).toLocaleDateString("pt-BR")}</TableCell>
                        <TableCell>
                          {h.status === "COMPLETED" && (
                            <Button size="sm" variant="ghost" onClick={() => handleUndo(h.id)}>
                              <Undo2 className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </AnimatedItem>
      ) : (
        <>
          {/* Step indicator */}
          <AnimatedItem>
            <div className="flex items-center gap-2">
              {STEPS.map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${i === step ? "bg-primary text-primary-foreground" : i < step ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground"}`}>
                    {i < step ? <Check className="h-3 w-3" /> : <span className="w-4 text-center">{i + 1}</span>}
                    <span className="hidden sm:inline">{s}</span>
                  </div>
                  {i < STEPS.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
                </div>
              ))}
            </div>
          </AnimatedItem>

          {/* Step 0: Upload */}
          {step === 0 && (
            <AnimatedItem>
              <Card>
                <CardHeader>
                  <CardTitle>Upload de Arquivo</CardTitle>
                  <CardDescription>Suporta CSV, OFX (bancos brasileiros) e QIF</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div
                    className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFileUpload(f); }}
                    onClick={() => document.getElementById("file-input")?.click()}
                  >
                    <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="font-medium">{file ? file.name : "Arraste o arquivo ou clique para selecionar"}</p>
                    <p className="text-sm text-muted-foreground mt-1">CSV, OFX, QIF — máx 10MB</p>
                    <input id="file-input" type="file" accept=".csv,.ofx,.qif" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }} />
                  </div>
                  {file && <p className="text-sm text-green-600"><Check className="h-4 w-4 inline mr-1" />{rows.length} linhas detectadas ({format})</p>}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Conta</label>
                      <Select value={accountId} onValueChange={setAccountId}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>{accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Categoria Padrão</label>
                      <Select value={categoryId} onValueChange={setCategoryId}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </AnimatedItem>
          )}

          {/* Step 1: Mapping */}
          {step === 1 && (
            <AnimatedItem>
              <Card>
                <CardHeader>
                  <CardTitle>Mapeamento de Colunas</CardTitle>
                  <CardDescription>Associe cada coluna do arquivo a um campo do sistema</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mapping.map((m, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <div className="w-48 px-3 py-2 bg-muted rounded text-sm font-mono">{m.source}</div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <Select value={m.target} onValueChange={v => setMapping(prev => prev.map((p, j) => j === i ? { ...p, target: v } : p))}>
                          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                          <SelectContent>{TARGET_FIELDS.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
                        </Select>
                        <div className="text-xs text-muted-foreground">ex: {rows[0]?.[m.source] || "—"}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </AnimatedItem>
          )}

          {/* Step 2: Preview */}
          {step === 2 && (
            <AnimatedItem>
              <Card>
                <CardHeader>
                  <CardTitle>Preview dos Dados</CardTitle>
                  <CardDescription>{errors.length > 0 && <span className="text-red-500">{errors.length} erro(s) encontrado(s)</span>}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-8">#</TableHead>
                          {headers.map(h => <TableHead key={h}>{h}</TableHead>)}
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rows.slice(0, 20).map((row, i) => {
                          const rowErrors = errors.filter(e => e.row === i);
                          return (
                            <TableRow key={i} className={rowErrors.length > 0 ? "bg-red-500/5" : ""}>
                              <TableCell className="text-xs">{i + 1}</TableCell>
                              {headers.map(h => (
                                <TableCell key={h} className={`text-sm ${rowErrors.some(e => e.field === mapping.find(m => m.source === h)?.target) ? "text-red-500 font-medium" : ""}`}>
                                  {row[h]}
                                </TableCell>
                              ))}
                              <TableCell>
                                {rowErrors.length > 0 ? (
                                  <Badge variant="destructive" className="text-xs"><AlertTriangle className="h-3 w-3 mr-1" />{rowErrors[0].message}</Badge>
                                ) : <Badge variant="secondary" className="text-xs"><Check className="h-3 w-3 mr-1" />OK</Badge>}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  {rows.length > 20 && <p className="text-sm text-muted-foreground mt-2">Mostrando 20 de {rows.length} linhas</p>}
                </CardContent>
              </Card>
            </AnimatedItem>
          )}

          {/* Step 3: Duplicates */}
          {step === 3 && (
            <AnimatedItem>
              <Card>
                <CardHeader>
                  <CardTitle>Revisão de Duplicatas</CardTitle>
                  <CardDescription>
                    {duplicates.length > 0 ? `${duplicates.length} possíveis duplicatas encontradas` : "Nenhuma duplicata detectada"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {duplicates.length > 0 ? (
                    <div className="space-y-2">
                      {duplicates.map(i => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5">
                          <div className="text-sm">
                            <span className="font-medium">Linha {i + 1}:</span>{" "}
                            {headers.map(h => rows[i]?.[h]).join(" | ")}
                          </div>
                          <Button size="sm" variant={selectedRows.has(i) ? "default" : "outline"} onClick={() => {
                            const next = new Set(selectedRows);
                            if (next.has(i)) next.delete(i); else next.add(i);
                            setSelectedRows(next);
                          }}>
                            {selectedRows.has(i) ? "Importar" : "Pular"}
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Check className="h-10 w-10 mx-auto text-green-500 mb-2" />
                      <p className="text-muted-foreground">Todas as linhas parecem únicas</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </AnimatedItem>
          )}

          {/* Step 4: Confirm */}
          {step === 4 && (
            <AnimatedItem>
              <Card>
                <CardHeader>
                  <CardTitle>Confirmar Importação</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-lg bg-muted text-center">
                      <div className="text-2xl font-bold">{selectedRows.size}</div>
                      <div className="text-sm text-muted-foreground">Total</div>
                    </div>
                    <div className="p-4 rounded-lg bg-green-500/10 text-center">
                      <div className="text-2xl font-bold text-green-600">{selectedRows.size - errors.filter(e => selectedRows.has(e.row)).length}</div>
                      <div className="text-sm text-muted-foreground">Válidas</div>
                    </div>
                    <div className="p-4 rounded-lg bg-red-500/10 text-center">
                      <div className="text-2xl font-bold text-red-600">{errors.filter(e => selectedRows.has(e.row)).length}</div>
                      <div className="text-sm text-muted-foreground">Com erro</div>
                    </div>
                    <div className="p-4 rounded-lg bg-yellow-500/10 text-center">
                      <div className="text-2xl font-bold text-yellow-600">{rows.length - selectedRows.size}</div>
                      <div className="text-sm text-muted-foreground">Ignoradas</div>
                    </div>
                  </div>
                  <Button onClick={handleImport} disabled={loading} className="w-full">
                    {loading ? "Importando..." : <><FileUp className="h-4 w-4 mr-2" /> Confirmar Importação</>}
                  </Button>
                </CardContent>
              </Card>
            </AnimatedItem>
          )}

          {/* Navigation */}
          <AnimatedItem>
            <div className="flex justify-between">
              <Button variant="outline" disabled={step === 0} onClick={() => setStep(s => s - 1)}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Anterior
              </Button>
              {step < STEPS.length - 1 && (
                <Button onClick={goNext}>
                  Próximo <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </AnimatedItem>
        </>
      )}
    </PageWrapper>
  );
}
