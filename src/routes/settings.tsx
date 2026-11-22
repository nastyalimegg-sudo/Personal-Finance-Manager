import { createFileRoute } from "@tanstack/react-router";
import { useRef } from "react";
import { PageHeader } from "@/components/AppShell";
import { clearAll, download, getState, replaceState, resetDemo, setState, useFinance, type State } from "@/lib/finance";
import { pageHead } from "@/lib/head";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({ head: pageHead("Ustawienia", "Waluta, motyw, kopia zapasowa i dane demonstracyjne."), component: SettingsPage });

function SettingsPage() {
  const s = useFinance(); const file = useRef<HTMLInputElement>(null);
  const upd = (p: Partial<State["settings"]>) => setState((st) => ({ ...st, settings: { ...st.settings, ...p } }));
  async function restore(f: File) {
    try {
      const d = JSON.parse(await f.text()) as State;
      if (!Array.isArray(d.transactions) || !Array.isArray(d.categories) || !d.settings) throw new Error();
      replaceState(d); toast.success("Przywrócono kopię zapasową");
    } catch { toast.error("Nieprawidłowy plik kopii zapasowej"); }
  }
  return (
    <div className="page-enter max-w-3xl space-y-4">
      <PageHeader title="Ustawienia" en="Settings" />
      <div className="panel grid gap-4 sm:grid-cols-2">
        <div><label className="label">Waluta · Currency</label><select className="field" value={s.settings.currency} onChange={(e) => upd({ currency: e.target.value })}>{["PLN", "EUR", "USD", "GBP", "UAH", "CZK"].map((c) => <option key={c}>{c}</option>)}</select></div>
        <div><label className="label">Motyw · Theme</label><select className="field" value={s.settings.theme} onChange={(e) => upd({ theme: e.target.value as "dark" | "light" })}><option value="dark">Ciemny · Dark</option><option value="light">Jasny · Light</option></select></div>
        <div><label className="label">Ostrzegaj przy wykorzystaniu budżetu (%)</label><input type="number" min={10} max={100} className="field num" value={s.settings.warnAt} onChange={(e) => { const n = Number(e.target.value); if (n >= 10 && n <= 100) upd({ warnAt: n }); }} /></div>
      </div>
      <div className="panel space-y-3">
        <div className="font-medium">Kopia zapasowa · Backup</div>
        <p className="text-sm text-muted-foreground">Dane są zapisywane automatycznie w przeglądarce. Możesz pobrać pełną kopię i przywrócić ją później.</p>
        <div className="flex flex-wrap gap-2">
          <button className="btn-ghost" onClick={() => { download(`finanse-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(getState(), null, 2), "application/json"); toast.success("Pobrano kopię"); }}>Utwórz kopię</button>
          <button className="btn-ghost" onClick={() => file.current?.click()}>Przywróć z pliku</button>
          <input ref={file} type="file" accept="application/json" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) restore(f); e.target.value = ""; }} />
        </div>
      </div>
      <div className="panel space-y-3">
        <div className="font-medium">Dane · Data</div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-ghost" onClick={() => { if (confirm("Zastąpić wszystkie dane danymi demonstracyjnymi?")) { resetDemo(); toast.success("Przywrócono dane demo"); } }}>Reset danych demo</button>
          <button className="btn-danger" onClick={() => { if (confirm("Usunąć wszystkie transakcje?")) { clearAll(); toast.success("Usunięto transakcje"); } }}>Usuń wszystkie transakcje</button>
        </div>
      </div>
    </div>
  );
}
