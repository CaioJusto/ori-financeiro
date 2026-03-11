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
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { Database } from "@/types/database";

type Tag = Database["public"]["Tables"]["tags"]["Row"];

const presetColors = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6",
  "#ec4899", "#f43f5e",
];

export default function TagsPage() {
  const { currentOrg } = useOrg();
  const [tags, setTags] = useState<Tag[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [formName, setFormName] = useState("");
  const [formColor, setFormColor] = useState(presetColors[0]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!currentOrg) return;
    loadTags();
  }, [currentOrg]);

  async function loadTags() {
    const { data } = await supabase
      .from("tags")
      .select("*")
      .eq("organization_id", currentOrg!.id)
      .order("name");
    setTags((data as Tag[]) ?? []);
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!currentOrg) return;

    await supabase.from("tags").insert({
      organization_id: currentOrg.id,
      name: formName,
      color: formColor,
    });

    resetForm();
    setCreateOpen(false);
    loadTags();
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingTag) return;

    await supabase
      .from("tags")
      .update({
        name: formName,
        color: formColor,
      })
      .eq("id", editingTag.id);

    resetForm();
    setEditOpen(false);
    setEditingTag(null);
    loadTags();
  }

  async function handleDelete(id: string) {
    await supabase.from("tags").delete().eq("id", id);
    loadTags();
  }

  function openEdit(tag: Tag) {
    setEditingTag(tag);
    setFormName(tag.name);
    setFormColor(tag.color);
    setEditOpen(true);
  }

  function resetForm() {
    setFormName("");
    setFormColor(presetColors[0]);
  }

  function TagForm({ onSubmit, submitLabel }: { onSubmit: (e: React.FormEvent) => void; submitLabel: string }) {
    return (
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Nome</Label>
          <Input
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="Ex: Marketing, Fornecedor..."
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
          <h1 className="text-2xl font-bold tracking-tight">Tags</h1>
          <p className="text-muted-foreground">
            Organize transações com tags personalizadas
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger render={<Button />}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Tag
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Tag</DialogTitle>
            </DialogHeader>
            <TagForm onSubmit={handleCreate} submitLabel="Criar Tag" />
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={(open) => { setEditOpen(open); if (!open) { setEditingTag(null); resetForm(); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Tag</DialogTitle>
          </DialogHeader>
          <TagForm onSubmit={handleEdit} submitLabel="Salvar" />
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="flex items-center justify-between p-4">
                <Skeleton className="h-6 w-24" />
                <div className="flex gap-1">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {tags.map((tag) => (
          <Card key={tag.id}>
            <CardContent className="flex items-center justify-between p-4">
              <Badge
                style={{ backgroundColor: tag.color + "20", color: tag.color }}
                className="text-sm"
              >
                <span
                  className="mr-2 inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
                {tag.name}
              </Badge>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => openEdit(tag)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-red-500"
                  onClick={() => handleDelete(tag.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {tags.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            Nenhuma tag criada. Tags ajudam a organizar suas transações.
          </div>
        )}
      </div>
      )}
    </div>
  );
}
