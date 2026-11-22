import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { currentMonth, fmt, monthKey, setState, sumBy, useFinance } from "@/lib/finance";
import { pageHead } from "@/lib/head";
import { toast } from "sonner";

export const Route = createFileRoute("/budget")({ head: pageHead("Budżet", "Miesięczny budżet i limity kategorii z ostrzeżeniami."), component: Budget });

function Bar({ pct, warnAt }: { pct: number; warnAt: number }) {
  const c = pct >= 100 ? "bg-expense" : pct >= warnAt ? "bg-warning" : "bg-income";
  return <div className="h-2.5 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full transition-all ${c}`} style={{ width: `${Math.min(pct, 100)}%` }} /></div>;
}

function Budget() {
  const s = useFinance(); const cur = s.settings.currency; const w = s.settings.warnAt;
  const month = s.transactions.filter((t) => monthKey(t.date) === currentMonth() && t.type === "expense");
  const spent = sumBy(month, "expense"); const pct = s.monthlyBudget ? (spent / s.monthlyBudget) * 100 : 0;
  const [b, setB] = useState(String(s.monthlyBudget));
  function saveBudget() { const n = Number(b.replace(",", ".")); if (!Number.isFinite(n) || n < 0) return void toast.error("Niepoprawna kwota"); setState((st) => ({ ...st, monthlyBudget: n })); toast.success("Zapisano budżet"); }
  function setLimit(id: string, v: string) {
    const n = v === "" ? undefined : Number(v.replace(",", "."));
    if (n !== undefined && (!Number.isFinite(n) || n < 0)) return void toast.error("Niepoprawny limit");
    setState((st) => ({ ...st, categories: st.categories.map((c) => { if (c.id !== id) return c; const { limit: _l, ...rest } = c; return n === undefined ? rest : { ...rest, limit: n }; }) }));
  }
  const warnings = s.categories.filter((c) => c.type === "expense" && c.limit).map((c) => ({ c, sp: sumBy(month.filter((t) => t.categoryId === c.id), "expense") })).filter(({ c, sp }) => (sp / c.limit!) * 100 >= w);

  return (
    <div className="page-enter space-y-6">
      <PageHeader title="Budżet" en="Budget" />
      {(pct >= w || warnings.length > 0) && (
        <div className="panel border-warning/50 bg-warning/10">
          <div className="mb-2 flex items-center gap-2 font-medium text-warning"><AlertTriangle size={18} />Ostrzeżenia · Warnings</div>
          <ul className="space-y-1 text-sm">
            {pct >= w && <li>Budżet miesięczny wykorzystany w {Math.round(pct)}%.</li>}
            {warnings.map(({ c, sp }) => <li key={c.id}>{c.name}: {fmt(sp, cur)} z {fmt(c.limit!, cur)} ({Math.round((sp / c.limit!) * 100)}%)</li>)}
          </ul>
        </div>)}
      <div className="panel">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><div className="label">Budżet miesięczny · Monthly budget</div><div className="num text-3xl font-semibold">{fmt(spent, cur)} <span className="text-lg text-muted-foreground">/ {fmt(s.monthlyBudget, cur)}</span></div></div>
          <div className="flex gap-2"><input className="field num w-36" value={b} onChange={(e) => setB(e.target.value)} /><button className="btn-primary" onClick={saveBudget}>Ustaw</button></div>
        </div>
        <div className="mt-4"><Bar pct={pct} warnAt={w} /></div>
        <p className="mt-2 text-sm text-muted-foreground">Pozostało: <span className="num">{fmt(s.monthlyBudget - spent, cur)}</span></p>
      </div>
      <div className="panel">
        <div className="mb-4 font-medium">Limity kategorii · Category limits</div>
        <div className="space-y-5">{s.categories.filter((c) => c.type === "expense").map((c) => {
          const sp = sumBy(month.filter((t) => t.categoryId === c.id), "expense"); const p = c.limit ? (sp / c.limit) * 100 : 0;
          return (
            <div key={c.id} className="grid items-center gap-3 md:grid-cols-[180px_1fr_140px]">
              <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />{c.name}</div>
              <div><Bar pct={p} warnAt={w} /><div className="num mt-1 text-xs text-muted-foreground">{fmt(sp, cur)}{c.limit ? ` / ${fmt(c.limit, cur)} · ${Math.round(p)}%` : " · brak limitu"}</div></div>
              <input className="field num" placeholder="Limit" defaultValue={c.limit ?? ""} onBlur={(e) => setLimit(c.id, e.target.value)} />
            </div>);
        })}</div>
      </div>
    </div>
  );
}
