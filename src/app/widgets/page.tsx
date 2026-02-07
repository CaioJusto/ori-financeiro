"use client";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageWrapper, AnimatedItem } from "@/components/page-wrapper";
import { Timer, Calculator, DollarSign, StickyNote, Play, Pause, RotateCcw } from "lucide-react";

// Pomodoro Timer Widget
function PomodoroWidget() {
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [mode, setMode] = useState<"work" | "break">("work");

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 0) {
          setRunning(false);
          setMode(m => m === "work" ? "break" : "work");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [running]);

  useEffect(() => {
    if (seconds === 0 && !running) {
      setSeconds(mode === "work" ? 25 * 60 : 5 * 60);
    }
  }, [mode, seconds, running]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2"><Timer className="h-4 w-4" /> Pomodoro</CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-3">
        <div className="text-sm text-muted-foreground uppercase">{mode === "work" ? "Foco" : "Pausa"}</div>
        <div className="text-4xl font-mono font-bold">{String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}</div>
        <div className="flex gap-2 justify-center">
          <Button size="sm" variant="outline" onClick={() => setRunning(!running)}>
            {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button size="sm" variant="outline" onClick={() => { setRunning(false); setSeconds(25 * 60); setMode("work"); }}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Calculator Widget
function CalculatorWidget() {
  const [calcMode, setCalcMode] = useState<"compound" | "roi" | "tip">("compound");
  const [principal, setPrincipal] = useState("10000");
  const [rate, setRate] = useState("12");
  const [period, setPeriod] = useState("12");
  const [tipAmount, setTipAmount] = useState("100");
  const [tipPercent, setTipPercent] = useState("15");

  const compoundResult = parseFloat(principal) * Math.pow(1 + parseFloat(rate) / 100 / 12, parseFloat(period));
  const roiResult = ((compoundResult - parseFloat(principal)) / parseFloat(principal)) * 100;
  const tipResult = parseFloat(tipAmount) * (1 + parseFloat(tipPercent) / 100);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2"><Calculator className="h-4 w-4" /> Calculadora</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-1">
          {(["compound", "roi", "tip"] as const).map(m => (
            <Button key={m} size="sm" variant={calcMode === m ? "default" : "outline"} onClick={() => setCalcMode(m)} className="text-xs flex-1">
              {m === "compound" ? "Juros" : m === "roi" ? "ROI" : "Gorjeta"}
            </Button>
          ))}
        </div>
        {calcMode === "tip" ? (
          <div className="space-y-2">
            <Input type="number" placeholder="Valor" value={tipAmount} onChange={e => setTipAmount(e.target.value)} />
            <Input type="number" placeholder="% gorjeta" value={tipPercent} onChange={e => setTipPercent(e.target.value)} />
            <div className="text-lg font-bold text-center">Total: R$ {tipResult.toFixed(2)}</div>
          </div>
        ) : (
          <div className="space-y-2">
            <Input type="number" placeholder="Capital inicial" value={principal} onChange={e => setPrincipal(e.target.value)} />
            <Input type="number" placeholder="Taxa anual (%)" value={rate} onChange={e => setRate(e.target.value)} />
            <Input type="number" placeholder="Meses" value={period} onChange={e => setPeriod(e.target.value)} />
            <div className="text-lg font-bold text-center">
              {calcMode === "compound" ? `R$ ${compoundResult.toFixed(2)}` : `${roiResult.toFixed(1)}%`}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Currency Converter Widget
function CurrencyWidget() {
  const [amount, setAmount] = useState("100");
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("BRL");
  const rates: Record<string, number> = { USD: 1, BRL: 0.2, EUR: 1.08, GBP: 1.27, JPY: 0.0067 };

  const converted = (parseFloat(amount) / (rates[from] || 1)) * (rates[to] || 1);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2"><DollarSign className="h-4 w-4" /> Conversor</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Valor" />
        <div className="flex gap-2">
          <select value={from} onChange={e => setFrom(e.target.value)} className="flex-1 px-2 py-1.5 rounded border border-border bg-background text-sm">
            {Object.keys(rates).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <span className="self-center text-muted-foreground">→</span>
          <select value={to} onChange={e => setTo(e.target.value)} className="flex-1 px-2 py-1.5 rounded border border-border bg-background text-sm">
            {Object.keys(rates).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="text-lg font-bold text-center">{converted.toFixed(2)} {to}</div>
      </CardContent>
    </Card>
  );
}

// Notepad Widget
function NotepadWidget() {
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("ori-notepad");
    if (saved) setNotes(saved);
  }, []);

  const handleChange = useCallback((value: string) => {
    setNotes(value);
    localStorage.setItem("ori-notepad", value);
  }, []);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2"><StickyNote className="h-4 w-4" /> Notas</CardTitle>
      </CardHeader>
      <CardContent>
        <textarea
          value={notes}
          onChange={e => handleChange(e.target.value)}
          className="w-full h-32 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Anotações financeiras rápidas..."
        />
      </CardContent>
    </Card>
  );
}

export default function WidgetsPage() {
  return (
    <PageWrapper>
      <AnimatedItem>
        <h1 className="text-2xl font-bold">Mini-Apps</h1>
        <p className="text-muted-foreground">Ferramentas rápidas para o dia a dia</p>
      </AnimatedItem>
      <AnimatedItem>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PomodoroWidget />
          <CalculatorWidget />
          <CurrencyWidget />
          <NotepadWidget />
        </div>
      </AnimatedItem>
    </PageWrapper>
  );
}
