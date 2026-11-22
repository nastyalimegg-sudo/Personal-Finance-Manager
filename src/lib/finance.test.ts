import { describe, it, expect } from "vitest";
import { sumBy, toCSV } from "./finance";
describe("finance", () => {
  it("sums by type", () => {
    const tx = [{ id: "1", type: "income" as const, amount: 100, date: "2026-01-01", categoryId: "a", description: "" }, { id: "2", type: "expense" as const, amount: 40, date: "2026-01-02", categoryId: "a", description: "" }];
    expect(sumBy(tx, "income")).toBe(100); expect(sumBy(tx, "expense")).toBe(40);
  });
  it("escapes CSV quotes", () => {
    const csv = toCSV([{ id: "1", type: "expense", amount: 5, date: "2026-01-01", categoryId: "x", description: 'a"b' }], []);
    expect(csv).toContain('"a""b"');
  });
});
