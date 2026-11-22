import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, Pencil, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { TxDialog } from "@/components/TxDialog";
import { download, fmt, setState, toCSV, useFinance, type Transaction } from "@/lib/finance";
import { pageHead } from "@/lib/head";
import { toast } from "sonner";

export const Route = createFileRoute("/transactions")({ head: pageHead("Transakcje", "Dodawaj, edytuj, filtruj i eksportuj transakcje."), component: Transactions });

function Transactions() {
  const s = useFinance(); const cur = s.settings.currency;
  const [open, setOpen] = useState(false); const [editing, setEditing] = useState<Transaction | null>(null);
  const [q, setQ] = useState(""); const [type, setType] = useState("all"); const [cat, setCat] = useState("all");
  const [from, setFrom] = useState(""); const [to, setTo] = useState("");
  const list = useMemo(() => s.transactions.filter((t) =>
    (type === "all" || t.type === type) && (cat === "all" || t.categoryId === cat) && (!from || t.date >= from) && (!to || t.date <= to) &&
    (!q || (t.description + " " + (t.note ?? "")).toLowerCase().includes(q.toLowerCase()))
  ).sort((a, b) => b.date.localeCompare(a.date)), [s.transactions, q, type, cat, from, to]);
  const cName = (id: string) => s.categories.find((c) => c.id === id);

  function del(t: Transaction) {
    if (!confirm(`Usunąć „${t.description}”?`)) return;
    setState((st) => ({ ...st, transactions: st.transactions.filter((x) => x.id !== t.id) })); toast.success("Usunięto transakcję");
  }

  return (
    <div className="page-enter">
      <PageHeader title="Transakcje" en="Transactions">
        <button className="btn-ghost" onClick={() => { download(`transakcje-${new Date().toISOString().slice(0, 10)}.csv`, "\uFEFF" + toCSV(list, s.categories), "text/csv;charset=utf-8"); toast.success("Wyeksportowano CSV"); }}><Download size={16} />Eksport CSV</button>
        <button className="btn-primary" onClick={() => { setEditing(null); setOpen(true); }}><Plus size={16} />Dodaj</button>
      </PageHeader>
      <div className="panel mb-4 grid gap-3 md:grid-cols-5">
        <div className="md:col-span-2"><label className="label">Szukaj · Search</label><input className="field" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Opis lub notatka…" /></div>
        <div><label className="label">Typ</label><select className="field" value={type} onChange={(e) => setType(e.target.value)}><option value="all">Wszystkie</option><option value="income">Przychody</option><option value="expense">Wydatki</option></select></div>
        <div><label className="label">Kategoria</label><select className="field" value={cat} onChange={(e) => setCat(e.target.value)}><option value="all">Wszystkie</option>{s.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
        <div className="grid grid-cols-2 gap-2"><div><label className="label">Od</label><input type="date" className="field px-2" value={from} onChange={(e) => setFrom(e.target.value)} /></div><div><label className="label">Do</label><input type="date" className="field px-2" value={to} onChange={(e) => setTo(e.target.value)} /></div></div>
      </div>
      <div className="panel overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground"><tr className="border-b border-border">{["Data", "Opis", "Kategoria", "Kwota", ""].map((h) => <th key={h} className="px-5 py-3 font-medium">{h}</th>)}</tr></thead>
          <tbody>{list.map((t) => (
            <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/40">
              <td className="num px-5 py-3 text-muted-foreground">{t.date}</td>
              <td className="px-5 py-3">{t.description}{t.note && <div className="text-xs text-muted-foreground">📝 {t.note}</div>}</td>
              <td className="px-5 py-3"><span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: cName(t.categoryId)?.color }} />{cName(t.categoryId)?.name ?? "—"}</span></td>
              <td className={`num px-5 py-3 ${t.type === "income" ? "text-income" : "text-expense"}`}>{t.type === "income" ? "+" : "−"}{fmt(t.amount, cur)}</td>
              <td className="px-5 py-3 text-right whitespace-nowrap">
                <button className="rounded p-2 hover:bg-accent" aria-label="Edytuj" onClick={() => { setEditing(t); setOpen(true); }}><Pencil size={15} /></button>
                <button className="rounded p-2 text-destructive hover:bg-accent" aria-label="Usuń" onClick={() => del(t)}><Trash2 size={15} /></button>
              </td>
            </tr>))}</tbody>
        </table>
        {list.length === 0 && <p className="p-8 text-center text-muted-foreground">Brak wyników · No results</p>}
        <div className="border-t border-border px-5 py-3 text-xs text-muted-foreground">{list.length} transakcji</div>
      </div>
      <TxDialog open={open} onOpenChange={setOpen} editing={editing} />
    </div>
  );
}
