import { useSyncExternalStore } from "react";

export type TxType = "income" | "expense";
export interface Category { id: string; name: string; type: TxType; color: string; limit?: number }
export interface Transaction { id: string; type: TxType; amount: number; date: string; categoryId: string; description: string; note?: string }
export interface Settings { currency: string; theme: "dark" | "light"; warnAt: number }
export interface State { transactions: Transaction[]; categories: Category[]; monthlyBudget: number; settings: Settings }

const KEY = "pfm-state-v1";
export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

const defaultCategories: Category[] = [
  { id: "food", name: "Jedzenie", type: "expense", color: "oklch(0.75 0.16 60)", limit: 1500 },
  { id: "transport", name: "Transport", type: "expense", color: "oklch(0.7 0.14 230)", limit: 500 },
  { id: "shopping", name: "Zakupy", type: "expense", color: "oklch(0.68 0.2 330)", limit: 800 },
  { id: "fun", name: "Rozrywka", type: "expense", color: "oklch(0.72 0.17 290)", limit: 400 },
  { id: "health", name: "Zdrowie", type: "expense", color: "oklch(0.7 0.17 20)", limit: 300 },
  { id: "edu", name: "Edukacja", type: "expense", color: "oklch(0.78 0.14 190)", limit: 300 },
  { id: "salary", name: "Wynagrodzenie", type: "income", color: "oklch(0.78 0.17 155)" },
  { id: "other-income", name: "Inne przychody", type: "income", color: "oklch(0.82 0.15 120)" },
];

function demo(): State {
  const tx: Transaction[] = [];
  const now = new Date();
  const exp: [string, string, number][] = [
    ["food", "Biedronka", 180], ["food", "Restauracja", 95], ["transport", "Bilet miesięczny", 110],
    ["transport", "Paliwo", 240], ["shopping", "Ubrania", 320], ["fun", "Kino", 60],
    ["health", "Apteka", 75], ["edu", "Kurs online", 150], ["food", "Lidl", 210],
  ];
  for (let m = 5; m >= 0; m--) {
    const d = (day: number) => new Date(now.getFullYear(), now.getMonth() - m, Math.min(day, m === 0 ? now.getDate() : 28)).toISOString().slice(0, 10);
    tx.push({ id: uid(), type: "income", amount: 7200, date: d(1), categoryId: "salary", description: "Wypłata" });
    if (m % 2 === 0) tx.push({ id: uid(), type: "income", amount: 600 + m * 50, date: d(15), categoryId: "other-income", description: "Freelance" });
    exp.forEach(([c, desc, a], i) => tx.push({ id: uid(), type: "expense", amount: Math.round(a * (0.8 + ((i * 7 + m * 3) % 5) / 10)), date: d(2 + i * 3), categoryId: c, description: desc }));
  }
  return { transactions: tx, categories: defaultCategories, monthlyBudget: 5000, settings: { currency: "PLN", theme: "dark", warnAt: 80 } };
}

let state: State = demo();
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = JSON.parse(raw);
    else localStorage.setItem(KEY, JSON.stringify(state));
  } catch { /* corrupted storage: keep demo */ }
}

export function setState(fn: (s: State) => State) {
  state = fn(state);
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { console.error("Save failed", e); }
  listeners.forEach((l) => l());
}
export function replaceState(s: State) { setState(() => s); }
export function resetDemo() { setState(() => demo()); }
export function clearAll() { setState((s) => ({ ...s, transactions: [] })); }
export function getState() { load(); return state; }

export function useFinance() {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => { load(); return state; },
    () => state,
  );
}

export function fmt(n: number, currency: string) {
  try { return new Intl.NumberFormat("pl-PL", { style: "currency", currency }).format(n); }
  catch { return `${n.toFixed(2)} ${currency}`; }
}
export const monthKey = (d: string) => d.slice(0, 7);
export const currentMonth = () => new Date().toISOString().slice(0, 7);
export function monthLabel(k: string) {
  const [y, m] = k.split("-").map(Number);
  return new Date(y!, (m ?? 1) - 1, 1).toLocaleDateString("pl-PL", { month: "short", year: "2-digit" });
}
export function lastMonths(n: number) {
  const out: string[] = []; const now = new Date();
  for (let i = n - 1; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`); }
  return out;
}
export function sumBy(tx: Transaction[], type: TxType) { return tx.filter((t) => t.type === type).reduce((a, t) => a + t.amount, 0); }

export function toCSV(tx: Transaction[], cats: Category[]) {
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const rows = tx.map((t) => [t.date, t.type === "income" ? "Przychód" : "Wydatek", cats.find((c) => c.id === t.categoryId)?.name ?? "", t.amount.toFixed(2), t.description, t.note ?? ""].map(String).map(esc).join(","));
  return ["Data,Typ,Kategoria,Kwota,Opis,Notatka", ...rows].join("\n");
}
export function download(name: string, content: string, mime: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const a = document.createElement("a"); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
}
