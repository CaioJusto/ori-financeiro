"use client";
import { useEffect, useState, use } from "react";
import { useSearchParams } from "next/navigation";

export default function EmbedWidgetPage({ params }: { params: Promise<{ widgetType: string }> }) {
  const { widgetType } = use(params);
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const theme = searchParams.get("theme") || "light";
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) { setError("Token required"); return; }
    fetch(`/api/widgets/${widgetType}?token=${token}`)
      .then((r) => { if (!r.ok) throw new Error("Failed"); return r.json(); })
      .then(setData)
      .catch(() => setError("Failed to load widget"));
  }, [widgetType, token]);

  const bg = theme === "dark" ? "#1a1a2e" : "#ffffff";
  const fg = theme === "dark" ? "#e0e0e0" : "#333333";
  const accent = searchParams.get("color") || "#7c3aed";

  if (error) return <div style={{ padding: 20, color: "red", fontFamily: "system-ui" }}>{error}</div>;
  if (!data) return <div style={{ padding: 20, fontFamily: "system-ui", color: fg, background: bg }}>Loading...</div>;

  return (
    <div style={{ padding: 20, fontFamily: "system-ui", background: bg, color: fg, minHeight: "100vh" }}>
      {widgetType === "balance-summary" && (
        <div>
          <h3 style={{ color: accent, margin: "0 0 12px", fontSize: 18 }}>Saldo Total</h3>
          <div style={{ fontSize: 32, fontWeight: "bold" }}>
            R$ {Number((data as Record<string, unknown>).total || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </div>
          <div style={{ marginTop: 16 }}>
            {((data as Record<string, unknown>).accounts as Array<{ name: string; balance: number }>)?.map((a, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${theme === "dark" ? "#333" : "#eee"}` }}>
                <span>{a.name}</span>
                <span style={{ fontWeight: 600 }}>R$ {a.balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {widgetType === "spending-chart" && (
        <div>
          <h3 style={{ color: accent, margin: "0 0 12px", fontSize: 18 }}>Gastos por Categoria</h3>
          {((data as Record<string, unknown>).categories as Array<{ name: string; amount: number }>)?.map((c, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 4 }}>
                <span>{c.name}</span><span>R$ {c.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={{ background: theme === "dark" ? "#333" : "#eee", borderRadius: 4, height: 8 }}>
                <div style={{ background: accent, borderRadius: 4, height: 8, width: `${Math.min(100, (c.amount / (((data as Record<string, unknown>).categories as Array<{ amount: number }>)[0]?.amount || 1)) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {widgetType === "budget-progress" && (
        <div>
          <h3 style={{ color: accent, margin: "0 0 12px", fontSize: 18 }}>Progresso dos Orçamentos</h3>
          {((data as Record<string, unknown>).budgets as Array<{ category: string; budgeted: number; spent: number; percent: number }>)?.map((b, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 4 }}>
                <span>{b.category}</span><span>{b.percent}%</span>
              </div>
              <div style={{ background: theme === "dark" ? "#333" : "#eee", borderRadius: 4, height: 8 }}>
                <div style={{ background: b.percent > 100 ? "#ef4444" : accent, borderRadius: 4, height: 8, width: `${Math.min(100, b.percent)}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {widgetType === "goal-progress" && (
        <div>
          <h3 style={{ color: accent, margin: "0 0 12px", fontSize: 18 }}>Metas de Poupança</h3>
          {((data as Record<string, unknown>).goals as Array<{ name: string; target: number; current: number; percent: number }>)?.map((g, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 4 }}>
                <span>{g.name}</span><span>R$ {g.current.toLocaleString("pt-BR")} / R$ {g.target.toLocaleString("pt-BR")}</span>
              </div>
              <div style={{ background: theme === "dark" ? "#333" : "#eee", borderRadius: 4, height: 8 }}>
                <div style={{ background: accent, borderRadius: 4, height: 8, width: `${Math.min(100, g.percent)}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 20, fontSize: 11, color: theme === "dark" ? "#666" : "#999", textAlign: "center" }}>
        Powered by Ori Financeiro
      </div>
    </div>
  );
}
