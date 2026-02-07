"use client";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { TrendingUp, Target, Lightbulb, ArrowRight } from "lucide-react";

export function WelcomePage({ onAccountCreated }: { onAccountCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", type: "personal", color: "#7c3aed" });
  const [saving, setSaving] = useState(false);

  const createAccount = async () => {
    if (!form.name.trim()) { toast.error("Nome é obrigatório"); return; }
    setSaving(true);
    const res = await fetch("/api/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      toast.success("Conta criada com sucesso!");
      setOpen(false);
      onAccountCreated();
    }
    setSaving(false);
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center">
      {/* Hero */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        {/* SVG Illustration */}
        <div className="mx-auto mb-8 w-48 h-48">
          <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <circle cx="100" cy="100" r="90" fill="hsl(var(--primary))" fillOpacity="0.08" />
            <circle cx="100" cy="100" r="65" fill="hsl(var(--primary))" fillOpacity="0.12" />
            <circle cx="100" cy="100" r="40" fill="hsl(var(--primary))" fillOpacity="0.18" />
            {/* Coin stack */}
            <ellipse cx="100" cy="115" rx="28" ry="8" fill="hsl(var(--primary))" fillOpacity="0.4" />
            <ellipse cx="100" cy="108" rx="28" ry="8" fill="hsl(var(--primary))" fillOpacity="0.5" />
            <ellipse cx="100" cy="101" rx="28" ry="8" fill="hsl(var(--primary))" fillOpacity="0.6" />
            <ellipse cx="100" cy="94" rx="28" ry="8" fill="hsl(var(--primary))" fillOpacity="0.7" />
            <ellipse cx="100" cy="87" rx="28" ry="8" fill="hsl(var(--primary))" fillOpacity="0.85" />
            {/* Dollar sign */}
            <text x="100" y="98" textAnchor="middle" fontSize="24" fontWeight="bold" fill="white">$</text>
            {/* Upward arrow */}
            <path d="M155 70 L165 55 L175 70" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="165" y1="55" x2="165" y2="85" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" />
            {/* Sparkles */}
            <circle cx="45" cy="60" r="3" fill="hsl(var(--primary))" fillOpacity="0.5" />
            <circle cx="155" cy="40" r="2" fill="hsl(var(--primary))" fillOpacity="0.4" />
            <circle cx="40" cy="130" r="2.5" fill="hsl(var(--primary))" fillOpacity="0.3" />
          </svg>
        </div>

        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Bem-vindo ao <span className="text-primary">Ori Financeiro</span>
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          Seu sistema completo de gestão financeira. Comece criando sua primeira conta para organizar suas finanças.
        </p>
        <Button size="lg" onClick={() => setOpen(true)} className="gap-2">
          Começar agora <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Feature cards */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-3 max-w-3xl mx-auto w-full">
        <Card className="border bg-card hover:border-primary/30 transition-colors">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-6 w-6 text-emerald-500" />
            </div>
            <h3 className="font-semibold mb-2">Controle seus gastos</h3>
            <p className="text-sm text-muted-foreground">
              Registre transações, categorize despesas e acompanhe para onde vai cada centavo.
            </p>
          </CardContent>
        </Card>

        <Card className="border bg-card hover:border-primary/30 transition-colors">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
              <Target className="h-6 w-6 text-blue-500" />
            </div>
            <h3 className="font-semibold mb-2">Acompanhe metas</h3>
            <p className="text-sm text-muted-foreground">
              Defina objetivos financeiros, crie metas de economia e veja seu progresso em tempo real.
            </p>
          </CardContent>
        </Card>

        <Card className="border bg-card hover:border-primary/30 transition-colors">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center mx-auto mb-4">
              <Lightbulb className="h-6 w-6 text-violet-500" />
            </div>
            <h3 className="font-semibold mb-2">Tome decisões inteligentes</h3>
            <p className="text-sm text-muted-foreground">
              Insights automáticos, projeções e relatórios para decisões financeiras mais conscientes.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Create account dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar sua primeira conta</DialogTitle>
            <DialogDescription>Uma conta é onde seu dinheiro fica — banco, carteira, poupança, etc.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome da conta</Label>
              <Input placeholder="Ex: Banco Principal" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal">Pessoal</SelectItem>
                  <SelectItem value="business">Empresarial</SelectItem>
                  <SelectItem value="savings">Poupança</SelectItem>
                  <SelectItem value="investment">Investimento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Cor</Label>
              <div className="flex gap-2 mt-1">
                {["#7c3aed", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#ec4899"].map((c) => (
                  <button key={c} onClick={() => setForm({ ...form, color: c })}
                    className={`w-8 h-8 rounded-full border-2 transition-transform ${form.color === c ? "border-foreground scale-110" : "border-transparent"}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
            <Button onClick={createAccount} disabled={saving} className="w-full">
              {saving ? "Criando..." : "Criar conta"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
