"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PageWrapper, AnimatedItem } from "@/components/page-wrapper";
import { toast } from "sonner";
import { FileText, Search, Trash2, Upload, File, Image as ImageIcon } from "lucide-react";

interface DocumentData {
  id: string; name: string; type: string; size: number; path: string;
  transactionId: string | null; tags: string; createdAt: string;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentsPage() {
  const [docs, setDocs] = useState<DocumentData[]>([]);
  const [search, setSearch] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPath, setNewPath] = useState("");
  const [newTags, setNewTags] = useState("");

  const load = () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    fetch(`/api/documents?${params}`).then(r => r.json()).then(setDocs);
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const upload = async () => {
    if (!newName || !newPath) return;
    await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName, path: newPath, type: newPath.split(".").pop() || "file",
        size: 0, tags: newTags.split(",").map(t => t.trim()).filter(Boolean),
      }),
    });
    toast.success("Documento adicionado");
    setNewName(""); setNewPath(""); setNewTags("");
    setShowUpload(false);
    load();
  };

  const remove = async (id: string) => {
    await fetch("/api/documents", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    toast.success("Documento removido");
    load();
  };

  const isImage = (name: string) => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(name);

  return (
    <PageWrapper>
      <AnimatedItem>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              <FileText className="h-6 w-6" /> Documentos
            </h1>
            <p className="text-sm text-muted-foreground">{docs.length} documentos</p>
          </div>
          <Button onClick={() => setShowUpload(!showUpload)}>
            <Upload className="h-4 w-4 mr-2" /> Adicionar
          </Button>
        </div>
      </AnimatedItem>
      <AnimatedItem><Separator /></AnimatedItem>

      {showUpload && (
        <AnimatedItem>
          <Card>
            <CardContent className="p-4 space-y-3">
              <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nome do documento" />
              <Input value={newPath} onChange={e => setNewPath(e.target.value)} placeholder="Caminho ou URL do arquivo" />
              <Input value={newTags} onChange={e => setNewTags(e.target.value)} placeholder="Tags (separadas por vírgula)" />
              <Button onClick={upload}>Salvar</Button>
            </CardContent>
          </Card>
        </AnimatedItem>
      )}

      <AnimatedItem>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar documentos..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === "Enter" && load()}
            className="pl-9"
          />
        </div>
      </AnimatedItem>

      <AnimatedItem>
        <Card>
          <CardHeader><CardTitle className="text-sm">Arquivos</CardTitle></CardHeader>
          <CardContent>
            {docs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum documento encontrado</p>
            ) : (
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {docs.map(doc => {
                  let tags: string[] = [];
                  try { tags = JSON.parse(doc.tags); } catch { /* */ }
                  return (
                    <div key={doc.id} className="p-4 rounded-lg border space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {isImage(doc.name) ? <ImageIcon className="h-5 w-5 text-blue-500" /> : <File className="h-5 w-5 text-muted-foreground" />}
                          <div>
                            <p className="text-sm font-medium">{doc.name}</p>
                            <p className="text-xs text-muted-foreground">{doc.type} • {formatSize(doc.size)}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => remove(doc.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                      {isImage(doc.name) && doc.path.startsWith("http") && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={doc.path} alt={doc.name} className="rounded border w-full h-32 object-cover" />
                      )}
                      {tags.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {tags.map((t, i) => <Badge key={i} variant="secondary" className="text-xs">{t}</Badge>)}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">{new Date(doc.createdAt).toLocaleDateString("pt-BR")}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </AnimatedItem>
    </PageWrapper>
  );
}
