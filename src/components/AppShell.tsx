import { Link, Outlet } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LayoutDashboard, ArrowLeftRight, Tags, PiggyBank, BarChart3, Settings, Wallet, Menu } from "lucide-react";
import { useFinance } from "@/lib/finance";
import { Toaster } from "@/components/ui/sonner";

const nav = [
  { to: "/", label: "Pulpit", en: "Dashboard", icon: LayoutDashboard },
  { to: "/transactions", label: "Transakcje", en: "Transactions", icon: ArrowLeftRight },
  { to: "/categories", label: "Kategorie", en: "Categories", icon: Tags },
  { to: "/budget", label: "Budżet", en: "Budget", icon: PiggyBank },
  { to: "/statistics", label: "Statystyki", en: "Statistics", icon: BarChart3 },
  { to: "/settings", label: "Ustawienia", en: "Settings", icon: Settings },
] as const;

export function AppShell() {
  const s = useFinance();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => { document.documentElement.classList.toggle("dark", s.settings.theme === "dark"); }, [s.settings.theme]);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-sidebar-border bg-sidebar p-4 transition-transform md:static md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="mb-8 flex items-center gap-3 px-2 pt-2">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground"><Wallet size={20} /></div>
          <div><div className="font-semibold leading-tight">Finanse</div><div className="text-xs text-muted-foreground">Personal Finance Manager</div></div>
        </div>
        <nav className="space-y-1">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} onClick={() => setOpen(false)} activeOptions={{ exact: n.to === "/" }}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
              activeProps={{ className: "bg-sidebar-accent text-sidebar-primary font-medium" }}>
              <n.icon size={18} />
              <span className="flex-1">{n.label}</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{n.en}</span>
            </Link>
          ))}
        </nav>
      </aside>
      {open && <div className="fixed inset-0 z-30 bg-background/70 md:hidden" onClick={() => setOpen(false)} />}
      <main className="min-w-0 flex-1">
        <div className="flex items-center gap-3 border-b border-border p-4 md:hidden">
          <button className="btn-ghost h-9 px-3" onClick={() => setOpen(true)} aria-label="Menu"><Menu size={18} /></button>
          <span className="font-semibold">Finanse</span>
        </div>
        <div className="mx-auto max-w-7xl p-4 md:p-8">{mounted ? <Outlet /> : <div className="text-muted-foreground">Ładowanie…</div>}</div>
      </main>
      <Toaster />
    </div>
  );
}

export function PageHeader({ title, en, children }: { title: string; en: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-xs uppercase tracking-widest text-primary">{en}</p><h1 className="text-3xl font-semibold">{title}</h1></div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export function Stat({ label, value, tone }: { label: string; value: string; tone?: "income" | "expense" | "warning" }) {
  const c = tone === "income" ? "text-income" : tone === "expense" ? "text-expense" : tone === "warning" ? "text-warning" : "";
  return <div className="panel"><div className="label">{label}</div><div className={`num mt-2 text-2xl font-semibold ${c}`}>{value}</div></div>;
}
