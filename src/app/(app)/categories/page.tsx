"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useOrg } from "@/contexts/org-context";
import { createClient } from "@/lib/supabase/client";
import { Plus, Pencil, Trash2, FolderTree } from "lucide-react";
import type { Database } from "@/types/database";

type Category = Database["public"]["Tables"]["categories"]["Row"];

const presetColors = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6",
  "#ec4899", "#f43f5e",
];

export default function CategoriesPage() {
  const { currentOrg } = useOrg();
  const [categories, setCategories] = useState<Category[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formName, setFormName] = useState("");
  const [formColor, setFormColor] = useState(presetColors[0]);
  const [formParentId, setFormParentId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!currentOrg) return;
    loadCategories();
  }, [currentOrg]);

  async function loadCategories() {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .eq("organization_id", currentOrg!.id)
      .order("name");
    setCategories((data as Category[]) ?? []);
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!currentOrg) return;

    await supabase.from("categories").insert({
      organization_id: currentOrg.id,
      name: formName,
      icon: formColor,
      parent_id: formParentId || null,
    });

    resetForm();
    setCreateOpen(false);
    loadCategories();
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingCategory) return;

    await supabase
      .from("categories")
      .update({
        name: formName,
        icon: formColor,
        parent_id: formParentId || null,
      })
      .eq("id", editingCategory.id);

    resetForm();
    setEditOpen(false);
    setEditingCategory(null);
    loadCategories();
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir esta categoria?")) return;
    await supabase.from("categories").delete().eq("id", id);
    loadCategories();
  }

  function openEdit(cat: Category) {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormColor(cat.icon ?? presetColors[0]);
    setFormParentId(cat.parent_id ?? "");
    setEditOpen(true);
  }

  function resetForm() {
    setFormName("");
    setFormColor(presetColors[0]);
    setFormParentId("");
  }

  // Organize categories: top-level first, then children
  const topLevel = categories.filter((c) => !c.parent_id);
  const children = categories.filter((c) => c.parent_id);

  function getChildren(parentId: string) {
    return children.filter((c) => c.parent_id === parentId);
  }

  function CategoryForm({ onSubmit, submitLabel }: { onSubmit: (e: React.FormEvent) => void; submitLabel: string }) {
    return (
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Nome</Label>
          <Input
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="Ex: Alimentacao, Transporte..."
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Cor</Label>
          <div className="flex flex-wrap gap-2">
            {presetColors.map((color) => (
              <button
                key={color}
                type="button"
                className={`h-8 w-8 rounded-full border-2 transition-all ${
                  formColor === color
                    ? "border-white scale-110"
                    : "border-transparent"
                }`}
                style={{ backgroundColor: color }}
                onClick={() => setFormColor(color)}
              />
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label>Categoria Pai (opcional)</Label>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            value={formParentId}
            onChange={(e) => setFormParentId(e.target.value)}
          >
            <option value="">Nenhuma (raiz)</option>
            {topLevel
              .filter((c) => c.id !== editingCategory?.id)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </select>
        </div>
        <Button type="submit" className="w-full">
          {submitLabel}
        </Button>
      </form>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categorias</h1>
          <p className="text-muted-foreground">
            Classifique transacoes por categoria
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger render={<Button />}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Categoria
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Categoria</DialogTitle>
            </DialogHeader>
            <CategoryForm onSubmit={handleCreate} submitLabel="Criar Categoria" />
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={(open) => { setEditOpen(open); if (!open) { setEditingCategory(null); resetForm(); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Categoria</DialogTitle>
          </DialogHeader>
          <CategoryForm onSubmit={handleEdit} submitLabel="Salvar" />
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-24" />
                  <div className="flex gap-1">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {topLevel.map((cat) => {
          const catChildren = getChildren(cat.id);
          const color = cat.icon ?? presetColors[0];
          return (
            <Card key={cat.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge
                    style={{ backgroundColor: color + "20", color: color }}
                    className="text-sm"
                  >
                    <span
                      className="mr-2 inline-block h-2 w-2 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    {cat.name}
                  </Badge>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => openEdit(cat)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-red-500"
                      onClick={() => handleDelete(cat.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {catChildren.length > 0 && (
                  <div className="ml-4 space-y-1">
                    {catChildren.map((child) => {
                      const childColor = child.icon ?? presetColors[0];
                      return (
                        <div key={child.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <FolderTree className="h-3 w-3" />
                            <Badge
                              variant="secondary"
                              style={{ backgroundColor: childColor + "20", color: childColor }}
                              className="text-xs"
                            >
                              {child.name}
                            </Badge>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-foreground"
                              onClick={() => openEdit(child)}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-red-500"
                              onClick={() => handleDelete(child.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {/* Show orphan children (parent deleted) */}
        {children
          .filter((c) => !topLevel.some((p) => p.id === c.parent_id))
          .map((cat) => {
            const color = cat.icon ?? presetColors[0];
            return (
              <Card key={cat.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <Badge
                    style={{ backgroundColor: color + "20", color: color }}
                    className="text-sm"
                  >
                    <span
                      className="mr-2 inline-block h-2 w-2 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    {cat.name}
                  </Badge>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => openEdit(cat)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-red-500"
                      onClick={() => handleDelete(cat.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}

        {categories.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            Nenhuma categoria criada. Categorias ajudam a classificar suas transacoes.
          </div>
        )}
      </div>
      )}
    </div>
  );
}
