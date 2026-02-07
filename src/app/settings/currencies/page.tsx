"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { PageWrapper, AnimatedItem } from "@/components/page-wrapper";
import { toast } from "sonner";
import { Plus, Trash2, DollarSign } from "lucide-react";

interface CurrencyRate {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  date: string;
}

export default function CurrenciesPage() {
  const [rates, setRates] = useState<CurrencyRate[]>([]);
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("BRL");
  const [rate, setRate] = useState("");

  const load = () => fetch("/api/currencies").then(r => r.json()).then(setRates);
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!from || !to || !rate) return;
    await fetch("/api/currencies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fromCurrency: from, toCurrency: to, rate: parseFloat(rate) }),
    });
    toast.success("Taxa salva");
    setRate("");
    load();
  };

  const remove = async (id: string) => {
    await fetch("/api/currencies", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    toast.success("Taxa removida");
    load();
  };

  return (
    <PageWrapper>
      <AnimatedItem>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <DollarSign className="h-6 w-6" /> Taxas de Câmbio
          </h1>
          <p className="text-sm text-muted-foreground">Gerencie as taxas de conversão entre moedas</p>
        </div>
      </AnimatedItem>
      <AnimatedItem><Separator /></AnimatedItem>

      <AnimatedItem>
        <Card>
          <CardHeader><CardTitle className="text-sm">Adicionar Taxa</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-3 items-end flex-wrap">
              <div><Label>De</Label><Input value={from} onChange={e => setFrom(e.target.value.toUpperCase())} placeholder="USD" className="w-24" /></div>
              <div><Label>Para</Label><Input value={to} onChange={e => setTo(e.target.value.toUpperCase())} placeholder="BRL" className="w-24" /></div>
              <div><Label>Taxa</Label><Input type="number" step="0.01" value={rate} onChange={e => setRate(e.target.value)} placeholder="5.00" className="w-32" /></div>
              <Button onClick={add}><Plus className="h-4 w-4 mr-1" /> Salvar</Button>
            </div>
          </CardContent>
        </Card>
      </AnimatedItem>

      <AnimatedItem>
        <Card>
          <CardHeader><CardTitle className="text-sm">Taxas Configuradas</CardTitle></CardHeader>
          <CardContent>
            {rates.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma taxa configurada</p>
            ) : (
              <div className="space-y-2">
                {rates.map(r => (
                  <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <span className="font-medium text-sm">{r.fromCurrency} → {r.toCurrency}</span>
                      <span className="text-sm text-muted-foreground ml-3">1 {r.fromCurrency} = {r.rate} {r.toCurrency}</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => remove(r.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </AnimatedItem>
    </PageWrapper>
  );
}
