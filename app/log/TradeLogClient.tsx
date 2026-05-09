"use client";

import { useState } from "react";
import Link from "next/link";

interface Trade {
  id: string;
  instrument: string;
  direction: "LONG" | "SHORT";
  entry_time: string;
  exit_time: string | null;
  entry_price: number;
  exit_price: number | null;
  status: string;
  strategy_name?: string | null;
  tags?: { name: string }[];
  rMultiple?: number | null;
  pnl?: number | null;
}

const ERROR_TAGS = ["FOMO", "Revenge Trading", "Oversize", "Hesitation"];

function DirectionBadge({ direction }: { direction: "LONG" | "SHORT" }) {
  return (
    <span className={`px-2 py-1 rounded font-mono text-[10px] font-bold tracking-wide border ${direction === "LONG" ? "bg-secondary/10 text-secondary border-secondary/20" : "bg-tertiary-container/10 text-tertiary-container border-tertiary-container/20"}`}>
      {direction}
    </span>
  );
}

function TagBadge({ tag }: { tag: string }) {
  const isError = ERROR_TAGS.includes(tag);
  return (
    <span className={`px-1.5 py-0.5 rounded font-mono text-[10px] uppercase border ${isError ? "bg-error-container/20 text-error border-error/30" : "bg-surface-container-highest text-on-surface-variant border-outline-variant"}`}>
      {tag}
    </span>
  );
}

export default function TradeLogClient({ initialTrades }: { initialTrades: Trade[] }) {
  const [instrumentFilter, setInstrumentFilter] = useState("Wszystkie");
  const [strategyFilter, setStrategyFilter] = useState("Wszystkie");
  const [directionFilter, setDirectionFilter] = useState("Wszystkie");

  const instruments = ["Wszystkie", ...Array.from(new Set(initialTrades.map((t) => t.instrument)))];
  const strategies = ["Wszystkie", ...Array.from(new Set(initialTrades.map((t) => t.strategy_name ?? "Brak").filter(Boolean)))];

  const filtered = initialTrades.filter((t) => {
    if (instrumentFilter !== "Wszystkie" && t.instrument !== instrumentFilter) return false;
    if (strategyFilter !== "Wszystkie" && (t.strategy_name ?? "Brak") !== strategyFilter) return false;
    if (directionFilter !== "Wszystkie" && t.direction !== directionFilter) return false;
    return true;
  });

  const wins = filtered.filter((t) => (t.pnl ?? 0) > 0).length;
  const losses = filtered.filter((t) => (t.pnl ?? 0) <= 0 && t.status === "CLOSED").length;
  const totalPnl = filtered.reduce((acc, t) => acc + (t.pnl ?? 0), 0);

  return (
    <>
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-3xl font-semibold text-on-surface">Dziennik Transakcji</h2>
          <p className="text-on-surface-variant mt-1">Zarządzaj i analizuj swoją historię zagrań.</p>
        </div>
        <Link href="/new" className="bg-primary text-on-primary px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-primary-fixed-dim transition-colors flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">add</span>
          Nowa Transakcja
        </Link>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Łącznie", value: filtered.length, color: "text-on-surface" },
          { label: "Wygrane", value: wins, color: "text-secondary" },
          { label: "Przegrane", value: losses, color: "text-tertiary-container" },
          {
            label: "Łączny P&L",
            value: `${totalPnl >= 0 ? "+" : ""}$${Math.abs(totalPnl).toLocaleString("pl-PL")}`,
            color: totalPnl >= 0 ? "text-secondary" : "text-tertiary-container",
          },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-surface-container-low border border-outline-variant rounded-lg p-4">
            <p className="font-mono text-[10px] text-on-surface-variant uppercase">{label}</p>
            <p className={`text-xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-surface-container border border-outline-variant rounded-lg p-5 mb-5 flex flex-wrap gap-5 items-end">
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-[10px] text-on-surface-variant uppercase">Instrument</label>
          <select value={instrumentFilter} onChange={(e) => setInstrumentFilter(e.target.value)} className="bg-surface-container-low border border-outline-variant rounded px-3 py-2 text-on-surface text-sm focus:border-primary focus:outline-none">
            {instruments.map((i) => <option key={i}>{i}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-[10px] text-on-surface-variant uppercase">Strategia</label>
          <select value={strategyFilter} onChange={(e) => setStrategyFilter(e.target.value)} className="bg-surface-container-low border border-outline-variant rounded px-3 py-2 text-on-surface text-sm focus:border-primary focus:outline-none">
            {strategies.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-[10px] text-on-surface-variant uppercase">Kierunek</label>
          <div className="flex gap-1 bg-surface-container-low border border-outline-variant rounded p-1">
            {["Wszystkie", "LONG", "SHORT"].map((d) => (
              <button key={d} onClick={() => setDirectionFilter(d)} className={`px-3 py-1 rounded font-mono text-[10px] uppercase transition-colors ${directionFilter === d ? "bg-surface-container-highest text-on-surface font-bold" : "text-on-surface-variant hover:text-on-surface"}`}>{d}</button>
            ))}
          </div>
        </div>
        <button onClick={() => { setInstrumentFilter("Wszystkie"); setStrategyFilter("Wszystkie"); setDirectionFilter("Wszystkie"); }} className="px-4 py-2 border border-outline-variant rounded text-on-surface-variant hover:text-on-surface hover:border-outline text-sm transition-colors flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px]">filter_list_off</span>
          Wyczyść
        </button>
      </div>

      {/* Table */}
      <div className="bg-surface-container rounded-lg border border-outline-variant overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="material-symbols-outlined text-[48px] text-on-surface-variant mb-3">receipt_long</span>
            <p className="text-on-surface-variant">Brak transakcji spełniających kryteria filtrowania.</p>
            <Link href="/new" className="mt-4 bg-primary text-on-primary px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-fixed-dim transition-colors">Dodaj Transakcję</Link>
          </div>
        ) : (
          <>
            <table className="w-full text-left">
              <thead className="bg-surface-container-low border-b border-outline-variant">
                <tr>
                  {["Data / Czas", "Instrument", "Kierunek", "Wejście", "Wyjście", "R-Multiple", "P&L", "Strategia / Tagi", ""].map((h) => (
                    <th key={h} className="font-mono text-[10px] text-on-surface-variant py-3 px-4 font-medium uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/50">
                {filtered.map((trade) => {
                  const isProfit = (trade.pnl ?? 0) > 0;
                  const date = new Date(trade.entry_time);
                  return (
                    <tr key={trade.id} className="hover:bg-surface-container-high/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-mono text-xs text-on-surface">{date.toLocaleDateString("pl-PL")}</div>
                        <div className="font-mono text-[10px] text-on-surface-variant">{date.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}</div>
                      </td>
                      <td className="py-3 px-4"><span className="text-sm font-semibold text-on-surface">{trade.instrument}</span></td>
                      <td className="py-3 px-4"><DirectionBadge direction={trade.direction} /></td>
                      <td className="py-3 px-4 text-right font-mono text-xs text-on-surface">{trade.entry_price}</td>
                      <td className="py-3 px-4 text-right font-mono text-xs text-on-surface">{trade.exit_price ?? "—"}</td>
                      <td className={`py-3 px-4 text-right font-mono text-sm font-bold ${trade.rMultiple !== null ? (isProfit ? "text-secondary" : "text-tertiary-container") : "text-on-surface-variant"}`}>
                        {trade.rMultiple !== null ? `${isProfit ? "+" : ""}${trade.rMultiple}R` : "—"}
                      </td>
                      <td className={`py-3 px-4 text-right font-mono text-sm font-bold ${trade.pnl !== null ? (isProfit ? "text-secondary" : "text-tertiary-container") : "text-on-surface-variant"}`}>
                        {trade.pnl != null ? `${isProfit ? "+" : ""}$${Math.abs(trade.pnl as number).toLocaleString("pl-PL")}` : "—"}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-xs text-on-surface mb-1">{trade.strategy_name ?? "—"}</div>
                        <div className="flex gap-1 flex-wrap">{(trade.tags ?? []).slice(0, 2).map((tag) => <TagBadge key={tag.name} tag={tag.name} />)}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-center gap-2">
                          <Link href={`/log/${trade.id}`} className="text-on-surface-variant hover:text-primary transition-colors">
                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="bg-surface-container-low border-t border-outline-variant px-5 py-3 flex justify-between items-center">
              <span className="font-mono text-xs text-on-surface-variant">Pokazano {filtered.length} z {initialTrades.length} transakcji</span>
            </div>
          </>
        )}
      </div>
    </>
  );
}
