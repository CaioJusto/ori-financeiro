"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";
import { PageWrapper, AnimatedItem } from "@/components/page-wrapper";
import { Treemap, ResponsiveContainer, Tooltip } from "recharts";

interface Category { name: string; color: string; total: number; children: { name: string; total: number }[] }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomContent = (props: any) => {
  const { x, y, width, height, name, value } = props;
  if (width < 40 || height < 30) return null;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={props.color || "#7c3aed"} stroke="#fff" strokeWidth={2} rx={4} />
      <text x={x + width / 2} y={y + height / 2 - 8} textAnchor="middle" fill="#fff" fontSize={width < 80 ? 10 : 12} fontWeight="bold">{name}</text>
      <text x={x + width / 2} y={y + height / 2 + 10} textAnchor="middle" fill="#ffffffcc" fontSize={10}>{formatCurrency(value)}</text>
    </g>
  );
};

export default function ExpenseBreakdownPage() {
  const [data, setData] = useState<Category[]>([]);
  const [selected, setSelected] = useState<Category | null>(null);
  const now = new Date();
  const [startDate, setStartDate] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`);
  const [endDate, setEndDate] = useState(now.toISOString().split("T")[0]);

  useEffect(() => {
    fetch(`/api/reports/expense-breakdown?startDate=${startDate}&endDate=${endDate}`)
      .then(r => r.json()).then(setData);
  }, [startDate, endDate]);

  const COLORS = ["#7c3aed", "#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#ec4899", "#06b6d4", "#8b5cf6"];
  const treemapData = data.map((c, i) => ({ name: c.name, value: c.total, color: COLORS[i % COLORS.length] }));
  const total = data.reduce((s, c) => s + c.total, 0);

  return (
    <PageWrapper><AnimatedItem><h1 className="text-2xl font-bold">Detalhamento de Despesas</h1><p className="text-muted-foreground mb-6">Treemap de despesas por categoria com drill-down</p></AnimatedItem>
      <AnimatedItem>
        <div className="flex gap-4 mb-6">
          <div><Label>Data Início</Label><Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
          <div><Label>Data Fim</Label><Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
        </div>
      </AnimatedItem>

      <AnimatedItem>
        <Card className="mb-6">
          <CardHeader><CardTitle>{selected ? `${selected.name} — Subcategorias` : "Despesas por Categoria"}</CardTitle></CardHeader>
          <CardContent>
            {selected ? (
              <div>
                <button onClick={() => setSelected(null)} className="text-sm text-primary underline mb-4">← Voltar</button>
                {selected.children.length > 0 ? (
                  <div className="space-y-2">
                    {selected.children.map(c => (
                      <div key={c.name} className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                        <span>{c.name}</span>
                        <div className="text-right">
                          <span className="font-medium">{formatCurrency(c.total)}</span>
                          <span className="text-muted-foreground text-sm ml-2">({((c.total / selected.total) * 100).toFixed(1)}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-muted-foreground">Sem subcategorias</p>}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <Treemap data={treemapData} dataKey="value" nameKey="name" content={<CustomContent />} onClick={(node: { name?: string }) => { if (node?.name) { const cat = data.find(c => c.name === node.name); if (cat) setSelected(cat); } }}>
                  <Tooltip formatter={(v) => formatCurrency(Number(v || 0))} />
                </Treemap>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </AnimatedItem>

      <AnimatedItem>
        <Card>
          <CardHeader><CardTitle>Resumo</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.map((c, i) => (
                <div key={c.name} className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 p-2 rounded-lg" onClick={() => setSelected(c)}>
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="flex-1">{c.name}</span>
                  <span className="font-medium">{formatCurrency(c.total)}</span>
                  <span className="text-muted-foreground text-sm w-16 text-right">{total > 0 ? ((c.total / total) * 100).toFixed(1) : 0}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </AnimatedItem>
    </PageWrapper>
  );
}
