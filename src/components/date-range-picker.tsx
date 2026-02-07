"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";

export interface DateRange {
  from: Date;
  to: Date;
  label: string;
}

const presets: { label: string; getRange: () => { from: Date; to: Date } }[] = [
  { label: "Hoje", getRange: () => { const d = new Date(); d.setHours(0,0,0,0); const t = new Date(d); t.setHours(23,59,59,999); return { from: d, to: t }; } },
  { label: "Ontem", getRange: () => { const d = new Date(); d.setDate(d.getDate()-1); d.setHours(0,0,0,0); const t = new Date(d); t.setHours(23,59,59,999); return { from: d, to: t }; } },
  { label: "Esta Semana", getRange: () => { const d = new Date(); const day = d.getDay(); const from = new Date(d); from.setDate(d.getDate()-day); from.setHours(0,0,0,0); return { from, to: new Date() }; } },
  { label: "Semana Passada", getRange: () => { const d = new Date(); const day = d.getDay(); const from = new Date(d); from.setDate(d.getDate()-day-7); from.setHours(0,0,0,0); const to = new Date(from); to.setDate(to.getDate()+6); to.setHours(23,59,59,999); return { from, to }; } },
  { label: "Este Mês", getRange: () => { const d = new Date(); return { from: new Date(d.getFullYear(), d.getMonth(), 1), to: new Date() }; } },
  { label: "Mês Passado", getRange: () => { const d = new Date(); const from = new Date(d.getFullYear(), d.getMonth()-1, 1); const to = new Date(d.getFullYear(), d.getMonth(), 0, 23, 59, 59, 999); return { from, to }; } },
  { label: "Este Trimestre", getRange: () => { const d = new Date(); const q = Math.floor(d.getMonth()/3)*3; return { from: new Date(d.getFullYear(), q, 1), to: new Date() }; } },
  { label: "Trimestre Passado", getRange: () => { const d = new Date(); const q = Math.floor(d.getMonth()/3)*3-3; const from = new Date(d.getFullYear(), q, 1); const to = new Date(d.getFullYear(), q+3, 0, 23,59,59,999); return { from, to }; } },
  { label: "Este Ano", getRange: () => ({ from: new Date(new Date().getFullYear(), 0, 1), to: new Date() }) },
  { label: "Ano Passado", getRange: () => { const y = new Date().getFullYear()-1; return { from: new Date(y, 0, 1), to: new Date(y, 11, 31, 23,59,59,999) }; } },
];

interface Props {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

export function DateRangePicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const applyPreset = (preset: typeof presets[0]) => {
    const range = preset.getRange();
    onChange({ ...range, label: preset.label });
    setOpen(false);
  };

  const applyCustom = () => {
    if (customFrom && customTo) {
      onChange({ from: new Date(customFrom), to: new Date(customTo + "T23:59:59.999"), label: "Personalizado" });
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Calendar className="h-4 w-4" />
          <span className="text-xs">{value.label}</span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="end">
        <div className="space-y-1 mb-3">
          {presets.map(p => (
            <Button key={p.label} variant="ghost" size="sm" className="w-full justify-start text-xs h-7" onClick={() => applyPreset(p)}>
              {p.label}
            </Button>
          ))}
        </div>
        <div className="border-t pt-3 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Personalizado</p>
          <div className="flex gap-2">
            <Input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className="text-xs h-8" />
            <Input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} className="text-xs h-8" />
          </div>
          <Button size="sm" className="w-full h-7 text-xs" onClick={applyCustom}>Aplicar</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
