import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader, Stat } from "@/components/AppShell";
import { TxDialog } from "@/components/TxDialog";
import { currentMonth, fmt, lastMonths, monthKey, monthLabel, sumBy, useFinance } from "@/lib/finance";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/")({ head: pageHead("Pulpit", "Saldo, przychody, wydatki i ostatnie transakcje."), component: Dashboard });

function Dashboard() {
  const s = useFinance(); const cur = s.settings.currency;
  const [open, setOpen] = useState(false);
  const month = s.transactions.filter((t) => monthKey(t.date) === currentMonth());
  const inc = sumBy(month, "income"), exp = sumBy(month, "expense");
  const balance = sumBy(s.transactions, "income") - sumBy(s.transactions, "expense");
  const data = lastMonths(6).map((m) => { const tx = s.transactions.filter((t) => monthKey(t.date) === m); return { m: monthLabel(m), Przychody: sumBy(tx, "income"), Wydatki: sumBy(tx, "expense") }; });
  const recent = [...s.transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
  const cat = (id: string) => s.categories.find((c) => c.id === id);

  return (
    <div className="page-enter space-y-6">
      <PageHeader title="Pulpit" en="Dashboard"><button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} />Dodaj transakcję</button></PageHeader>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Saldo całkowite" value={fmt(balance, cur)} />
        <Stat label="Przychody (miesiąc)" value={fmt(inc, cur)} tone="income" />
        <Stat label="Wydatki (miesiąc)" value={fmt(exp, cur)} tone="expense" />
        <Stat label="Pozostały budżet" value={fmt(s.monthlyBudget - exp, cur)} tone={s.monthlyBudget - exp < 0 ? "expense" : "warning"} />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="panel lg:col-span-2">
          <div className="mb-4 font-medium">Przychody vs wydatki <span className="text-xs text-muted-foreground">· last 6 months</span></div>
          <div className="h-72"><ResponsiveContainer><AreaChart data={data}>
            <CartesianGrid stroke="var(--border)" vertical={false} /><XAxis dataKey="m" stroke="var(--muted-foreground)" fontSize={12} /><YAxis stroke="var(--muted-foreground)" fontSize={12} />
            <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} formatter={(v: number) => fmt(v, cur)} />
            <Area dataKey="Przychody" stroke="var(--income)" fill="var(--income)" fillOpacity={0.15} strokeWidth={2} />
            <Area dataKey="Wydatki" stroke="var(--expense)" fill="var(--expense)" fillOpacity={0.15} strokeWidth={2} />
          </AreaChart></ResponsiveContainer></div>
        </div>
        <div className="panel">
          <div className="mb-4 font-medium">Statystyki miesiąca <span className="text-xs text-muted-foreground">· this month</span></div>
          <dl className="space-y-3 text-sm">
            <Row k="Liczba transakcji" v={String(month.length)} />
            <Row k="Bilans miesiąca" v={fmt(inc - exp, cur)} />
            <Row k="Średni wydatek" v={fmt(month.filter((t) => t.type === "expense").length ? exp / month.filter((t) => t.type === "expense").length : 0, cur)} />
            <Row k="Wykorzystanie budżetu" v={`${s.monthlyBudget ? Math.round((exp / s.monthlyBudget) * 100) : 0}%`} />
          </dl>
        </div>
      </div>
      <div className="panel">
        <div className="mb-4 flex items-center justify-between"><span className="font-medium">Ostatnie transakcje</span><Link to="/transactions" className="text-sm text-primary">Zobacz wszystkie →</Link></div>
        {recent.length === 0 ? <p className="text-sm text-muted-foreground">Brak transakcji.</p> : (
          <ul className="divide-y divide-border">{recent.map((t) => (
            <li key={t.id} className="flex items-center gap-3 py-3">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: cat(t.categoryId)?.color }} />
              <div className="flex-1"><div className="text-sm">{t.description}</div><div className="text-xs text-muted-foreground">{cat(t.categoryId)?.name} · {t.date}</div></div>
              <span className={`num text-sm ${t.type === "income" ? "text-income" : "text-expense"}`}>{t.type === "income" ? "+" : "−"}{fmt(t.amount, cur)}</span>
            </li>))}</ul>)}
      </div>
      <TxDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
function Row({ k, v }: { k: string; v: string }) { return <div className="flex justify-between"><dt className="text-muted-foreground">{k}</dt><dd className="num">{v}</dd></div>; }
