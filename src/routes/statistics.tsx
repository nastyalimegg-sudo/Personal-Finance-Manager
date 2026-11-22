import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader, Stat } from "@/components/AppShell";
import { fmt, lastMonths, monthKey, monthLabel, sumBy, useFinance } from "@/lib/finance";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/statistics")({ head: pageHead("Statystyki", "Wykresy wydatków według miesięcy i kategorii."), component: Stats });
const tip = { contentStyle: { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 } };

function Stats() {
  const s = useFinance(); const cur = s.settings.currency;
  const [n, setN] = useState(6);
  const months = lastMonths(n);
  const tx = s.transactions.filter((t) => months.includes(monthKey(t.date)));
  const byMonth = months.map((m) => { const x = tx.filter((t) => monthKey(t.date) === m); return { m: monthLabel(m), Przychody: sumBy(x, "income"), Wydatki: sumBy(x, "expense") }; });
  const byCat = s.categories.filter((c) => c.type === "expense").map((c) => ({ name: c.name, color: c.color, value: sumBy(tx.filter((t) => t.categoryId === c.id), "expense") })).filter((c) => c.value > 0).sort((a, b) => b.value - a.value);
  const inc = sumBy(tx, "income"), exp = sumBy(tx, "expense");
  return (
    <div className="page-enter space-y-6">
      <PageHeader title="Statystyki" en="Statistics">
        {[1, 3, 6, 12].map((x) => <button key={x} onClick={() => setN(x)} className={n === x ? "btn-primary" : "btn-ghost"}>{x === 1 ? "Ten miesiąc" : `${x} mies.`}</button>)}
      </PageHeader>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Przychody" value={fmt(inc, cur)} tone="income" /><Stat label="Wydatki" value={fmt(exp, cur)} tone="expense" />
        <Stat label="Oszczędności" value={fmt(inc - exp, cur)} /><Stat label="Najdroższa kategoria" value={byCat[0]?.name ?? "—"} tone="warning" />
      </div>
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="panel lg:col-span-3"><div className="mb-4 font-medium">Przychody vs wydatki · by month</div>
          <div className="h-80"><ResponsiveContainer><BarChart data={byMonth}><CartesianGrid stroke="var(--border)" vertical={false} /><XAxis dataKey="m" stroke="var(--muted-foreground)" fontSize={12} /><YAxis stroke="var(--muted-foreground)" fontSize={12} /><Tooltip {...tip} formatter={(v: number) => fmt(v, cur)} cursor={{ fill: "var(--muted)" }} /><Legend /><Bar dataKey="Przychody" fill="var(--income)" radius={[6, 6, 0, 0]} /><Bar dataKey="Wydatki" fill="var(--expense)" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div></div>
        <div className="panel lg:col-span-2"><div className="mb-4 font-medium">Wydatki wg kategorii · by category</div>
          {byCat.length === 0 ? <p className="text-sm text-muted-foreground">Brak danych.</p> : <>
            <div className="h-56"><ResponsiveContainer><PieChart><Pie data={byCat} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2} stroke="none">{byCat.map((c) => <Cell key={c.name} fill={c.color} />)}</Pie><Tooltip {...tip} formatter={(v: number) => fmt(v, cur)} /></PieChart></ResponsiveContainer></div>
            <ul className="mt-3 space-y-1.5 text-sm">{byCat.map((c) => <li key={c.name} className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} /><span className="flex-1">{c.name}</span><span className="num text-muted-foreground">{fmt(c.value, cur)} · {Math.round((c.value / exp) * 100)}%</span></li>)}</ul></>}
        </div>
      </div>
    </div>
  );
}
