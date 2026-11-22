import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { setState, uid, useFinance, type Transaction, type TxType } from "@/lib/finance";
import { toast } from "sonner";

export function TxDialog({ open, onOpenChange, editing }: { open: boolean; onOpenChange: (o: boolean) => void; editing?: Transaction | null }) {
  const s = useFinance();
  const today = new Date().toISOString().slice(0, 10);
  const [type, setType] = useState<TxType>("expense");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today);
  const [categoryId, setCat] = useState("");
  const [description, setDesc] = useState("");
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!open) return;
    setErr("");
    if (editing) { setType(editing.type); setAmount(String(editing.amount)); setDate(editing.date); setCat(editing.categoryId); setDesc(editing.description); setNote(editing.note ?? ""); }
    else { setType("expense"); setAmount(""); setDate(today); setCat(""); setDesc(""); setNote(""); }
  }, [open, editing]); // eslint-disable-line react-hooks/exhaustive-deps

  const cats = s.categories.filter((c) => c.type === type);

  function save(e: React.FormEvent) {
    e.preventDefault();
    const a = Number(amount.replace(",", "."));
    if (!Number.isFinite(a) || a <= 0) return setErr("Kwota musi być liczbą większą od zera.");
    if (a > 1e9) return setErr("Kwota jest zbyt duża.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return setErr("Podaj poprawną datę.");
    if (!cats.some((c) => c.id === categoryId)) return setErr("Wybierz kategorię.");
    if (!description.trim()) return setErr("Dodaj opis.");
    if (description.length > 120) return setErr("Opis może mieć maks. 120 znaków.");
    const tx: Transaction = { id: editing?.id ?? uid(), type, amount: Math.round(a * 100) / 100, date, categoryId, description: description.trim(), ...(note.trim() ? { note: note.trim() } : {}) };
    setState((st) => ({ ...st, transactions: editing ? st.transactions.map((t) => (t.id === tx.id ? tx : t)) : [tx, ...st.transactions] }));
    toast.success(editing ? "Transakcja zaktualizowana" : "Transakcja dodana");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{editing ? "Edytuj transakcję" : "Nowa transakcja"}</DialogTitle></DialogHeader>
        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {(["expense", "income"] as const).map((t) => (
              <button type="button" key={t} onClick={() => { setType(t); setCat(""); }}
                className={type === t ? (t === "income" ? "btn bg-income text-primary-foreground" : "btn bg-expense text-destructive-foreground") : "btn-ghost"}>
                {t === "income" ? "Przychód · Income" : "Wydatek · Expense"}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Kwota</label><input className="field num" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" /></div>
            <div><label className="label">Data</label><input type="date" className="field" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          </div>
          <div><label className="label">Kategoria</label>
            <select className="field" value={categoryId} onChange={(e) => setCat(e.target.value)}>
              <option value="">— wybierz —</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select></div>
          <div><label className="label">Opis</label><input className="field" value={description} onChange={(e) => setDesc(e.target.value)} maxLength={120} /></div>
          <div><label className="label">Notatka (opcjonalnie)</label><textarea className="field h-20 py-2" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} /></div>
          {err && <p className="text-sm text-destructive">{err}</p>}
          <div className="flex justify-end gap-2"><button type="button" className="btn-ghost" onClick={() => onOpenChange(false)}>Anuluj</button><button className="btn-primary">Zapisz</button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
