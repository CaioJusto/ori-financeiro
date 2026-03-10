"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useOrg } from "@/contexts/org-context";
import { createClient } from "@/lib/supabase/client";
import { Plus, Trash2 } from "lucide-react";
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(presetColors[0]);
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
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!currentOrg) return;

    await supabase.from("tags").insert({
      organization_id: currentOrg.id,
      name: newName,
      color: newColor,
    });

    setNewName("");
    setNewColor(presetColors[0]);
    setDialogOpen(false);
    loadTags();
  }

  async function handleDelete(id: string) {
    await supabase.from("tags").delete().eq("id", id);
    loadTags();
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
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Tag
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Tag</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
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
                        newColor === color
                          ? "border-white scale-110"
                          : "border-transparent"
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewColor(color)}
                    />
                  ))}
                </div>
              </div>
              <Button type="submit" className="w-full">
                Criar Tag
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

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
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-red-500"
                onClick={() => handleDelete(tag.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}

        {tags.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            Nenhuma tag criada. Tags ajudam a organizar suas transações.
          </div>
        )}
      </div>
    </div>
  );
}
