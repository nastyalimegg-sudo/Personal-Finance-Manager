import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { setState, uid, useFinance, type TxType } from "@/lib/finance";
import { pageHead } from "@/lib/head";
import { toast } from "sonner";

export const Route = createFileRoute("/categories")({ head: pageHead("Kategorie", "Zarządzaj kategoriami przychodów i wydatków."), component: Categories });
const palette = ["oklch(0.75 0.16 60)", "oklch(0.7 0.14 230)", "oklch(0.68 0.2 330)", "oklch(0.72 0.17 290)", "oklch(0.78 0.17 155)", "oklch(0.7 0.17 20)", "oklch(0.8 0.15 100)"];

function Categories() {
  const s = useFinance();
  const [name, setName] = useState(""); const [type, setType] = useState<TxType>("expense"); const [color, setColor] = useState(palette[0]!);
  function add(e: React.FormEvent) {
    e.preventDefault(); const n = name.trim();
    if (!n) return void toast.error("Podaj nazwę kategorii");
    if (n.length > 30) return void toast.error("Nazwa może mieć maks. 30 znaków");
    if (s.categories.some((c) => c.name.toLowerCase() === n.toLowerCase())) return void toast.error("Taka kategoria już istnieje");
    setState((st) => ({ ...st, categories: [...st.categories, { id: uid(), name: n, type, color }] })); setName(""); toast.success("Dodano kategorię");
  }
  function del(id: string) {
    const used = s.transactions.filter((t) => t.categoryId === id).length;
    if (used) return void toast.error(`Kategoria jest używana w ${used} transakcjach`);
    setState((st) => ({ ...st, categories: st.categories.filter((c) => c.id !== id) })); toast.success("Usunięto kategorię");
  }
  return (
    <div className="page-enter">
      <PageHeader title="Kategorie" en="Categories" />
      <form onSubmit={add} className="panel mb-6 grid gap-3 md:grid-cols-[1fr_180px_auto_auto] md:items-end">
        <div><label className="label">Nowa kategoria</label><input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="np. Podróże" /></div>
        <div><label className="label">Typ</label><select className="field" value={type} onChange={(e) => setType(e.target.value as TxType)}><option value="expense">Wydatek</option><option value="income">Przychód</option></select></div>
        <div className="flex gap-1.5 pb-2">{palette.map((p) => <button type="button" key={p} aria-label="Kolor" onClick={() => setColor(p)} className={`h-7 w-7 rounded-full border-2 ${color === p ? "border-foreground" : "border-transparent"}`} style={{ background: p }} />)}</div>
        <button className="btn-primary">Dodaj</button>
      </form>
      {(["expense", "income"] as const).map((t) => (
        <section key={t} className="mb-6">
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">{t === "expense" ? "Wydatki · Expenses" : "Przychody · Income"}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{s.categories.filter((c) => c.type === t).map((c) => (
            <div key={c.id} className="panel flex items-center gap-3 p-4">
              <span className="h-9 w-9 rounded-lg" style={{ background: c.color }} />
              <div className="flex-1"><div className="font-medium">{c.name}</div><div className="text-xs text-muted-foreground">{s.transactions.filter((x) => x.categoryId === c.id).length} transakcji</div></div>
              <button className="rounded p-2 text-muted-foreground hover:text-destructive" aria-label="Usuń" onClick={() => del(c.id)}><Trash2 size={15} /></button>
            </div>))}</div>
        </section>))}
    </div>
  );
}
