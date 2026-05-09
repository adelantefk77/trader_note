"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";

interface Trade {
  id: string;
  instrument: string;
  direction: "LONG" | "SHORT";
  entry_time: string;
  exit_time: string | null;
  entry_price: number;
  exit_price: number | null;
  stop_loss: number;
  take_profit: number | null;
  position_size: number;
  commission_fees: number;
  status: string;
  strategy_name?: string | null;
  tags?: { name: string }[];
  rMultiple?: number | null;
  pnl?: number | null;
}

const ERROR_TAGS = ["FOMO", "Revenge Trading", "Oversize", "Hesitation"];

function DirectionBadge({ direction }: { direction: "LONG" | "SHORT" }) {
  return (
    <span className={`px-2 py-1 rounded font-mono text-[10px] font-bold tracking-wide border ${
      direction === "LONG"
        ? "bg-secondary/10 text-secondary border-secondary/20"
        : "bg-tertiary-container/10 text-tertiary-container border-tertiary-container/20"
    }`}>
      {direction}
    </span>
  );
}

function TagBadge({ tag }: { tag: string }) {
  return (
    <span className={`px-1.5 py-0.5 rounded font-mono text-[10px] uppercase border ${
      ERROR_TAGS.includes(tag)
        ? "bg-error-container/20 text-error border-error/30"
        : "bg-surface-container-highest text-on-surface-variant border-outline-variant"
    }`}>
      {tag}
    </span>
  );
}

function calcUnrealized(trade: Trade, livePrice: number) {
  const priceDiff = trade.direction === "LONG"
    ? livePrice - trade.entry_price
    : trade.entry_price - livePrice;
  const pnl = priceDiff * trade.position_size - trade.commission_fees;
  const riskDist = Math.abs(trade.entry_price - trade.stop_loss);
  const riskAmount = riskDist * trade.position_size;
  const rMultiple = riskAmount > 0 ? (priceDiff * trade.position_size) / riskAmount : null;
  return {
    pnl: Math.round(pnl * 100) / 100,
    rMultiple: rMultiple !== null ? Math.round(rMultiple * 100) / 100 : null,
  };
}

export default function TradeLogClient({ initialTrades }: { initialTrades: Trade[] }) {
  const [instrumentFilter, setInstrumentFilter] = useState("Wszystkie");
  const [strategyFilter, setStrategyFilter] = useState("Wszystkie");
  const [directionFilter, setDirectionFilter] = useState("Wszystkie");
  const [statusFilter, setStatusFilter] = useState("Wszystkie");

  // Live ceny z Bybit dla otwartych pozycji
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  const [liveLoading, setLiveLoading] = useState(false);

  useEffect(() => {
    const openSymbols = [
      ...new Set(
        initialTrades
          .filter((t) => t.status === "OPEN")
          .map((t) => t.instrument.toUpperCase().replace(/\.P$/i, ""))
      ),
    ];
    if (openSymbols.length === 0) return;

    setLiveLoading(true);
    Promise.all(
      openSymbols.map(async (symbol) => {
        try {
          const res = await fetch(
            `https://api.bybit.com/v5/market/tickers?category=linear&symbol=${symbol}`,
            { cache: "no-store" }
          );
          const json = await res.json();
          const ticker = json?.result?.list?.[0];
          if (ticker) return { symbol, price: parseFloat(ticker.lastPrice) };
        } catch {}
        return null;
      })
    ).then((results) => {
      const prices: Record<string, number> = {};
      results.forEach((r) => { if (r) prices[r.symbol] = r.price; });
      setLivePrices(prices);
      setLiveLoading(false);
    });
  }, [initialTrades]);

  const instruments = ["Wszystkie", ...Array.from(new Set(initialTrades.map((t) => t.instrument)))];
  const strategies = ["Wszystkie", ...Array.from(new Set(initialTrades.map((t) => t.strategy_name ?? "Brak")))];

  const filtered = initialTrades.filter((t) => {
    if (instrumentFilter !== "Wszystkie" && t.instrument !== instrumentFilter) return false;
    if (strategyFilter !== "Wszystkie" && (t.strategy_name ?? "Brak") !== strategyFilter) return false;
    if (directionFilter !== "Wszystkie" && t.direction !== directionFilter) return false;
    if (statusFilter !== "Wszystkie" && t.status !== statusFilter) return false;
    return true;
  });

  // Dla każdej transakcji — P&L i R-Multiple (zamknięte: z bazy; otwarte: live z Bybit)
  const enriched = filtered.map((trade) => {
    if (trade.status === "CLOSED") {
      return { ...trade, displayPnl: trade.pnl, displayR: trade.rMultiple, isLive: false };
    }
    const sym = trade.instrument.toUpperCase().replace(/\.P$/i, "");
    const livePrice = livePrices[sym];
    if (livePrice !== undefined) {
      const unrealized = calcUnrealized(trade, livePrice);
      return { ...trade, displayPnl: unrealized.pnl, displayR: unrealized.rMultiple, isLive: true, livePrice };
    }
    return { ...trade, displayPnl: null, displayR: null, isLive: false };
  });

  const closedTrades = enriched.filter((t) => t.status === "CLOSED");
  const wins = closedTrades.filter((t) => (t.displayPnl ?? 0) > 0).length;
  const losses = closedTrades.filter((t) => (t.displayPnl ?? 0) <= 0).length;
  const totalPnl = closedTrades.reduce((a, t) => a + (t.displayPnl ?? 0), 0);
  const openCount = filtered.filter((t) => t.status === "OPEN").length;

  return (
    <>
      {/* Nagłówek */}
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

      {/* KPI */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="bg-surface-container-low border border-outline-variant rounded-lg p-4">
          <p className="font-mono text-[10px] text-on-surface-variant uppercase">Łącznie</p>
          <p className="text-xl font-bold text-on-surface mt-1">{filtered.length}</p>
        </div>
        <div className="bg-surface-container-low border border-outline-variant rounded-lg p-4">
          <p className="font-mono text-[10px] text-on-surface-variant uppercase">Otwarte</p>
          <p className="text-xl font-bold text-primary mt-1 flex items-center gap-1.5">
            {openCount}
            {liveLoading && openCount > 0 && (
              <span className="material-symbols-outlined text-[14px] animate-spin text-on-surface-variant">progress_activity</span>
            )}
          </p>
        </div>
        <div className="bg-surface-container-low border border-outline-variant rounded-lg p-4">
          <p className="font-mono text-[10px] text-on-surface-variant uppercase">Wygrane</p>
          <p className="text-xl font-bold text-secondary mt-1">{wins}</p>
        </div>
        <div className="bg-surface-container-low border border-outline-variant rounded-lg p-4">
          <p className="font-mono text-[10px] text-on-surface-variant uppercase">Przegrane</p>
          <p className="text-xl font-bold text-tertiary-container mt-1">{losses}</p>
        </div>
        <div className="bg-surface-container-low border border-outline-variant rounded-lg p-4">
          <p className="font-mono text-[10px] text-on-surface-variant uppercase">Łączny P&L</p>
          <p className={`text-xl font-bold mt-1 ${totalPnl >= 0 ? "text-secondary" : "text-tertiary-container"}`}>
            {totalPnl >= 0 ? "+" : ""}${totalPnl.toLocaleString("pl-PL")}
          </p>
        </div>
      </div>

      {/* Filtry */}
      <div className="bg-surface-container border border-outline-variant rounded-lg p-5 mb-5 flex flex-wrap gap-5 items-end">
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-[10px] text-on-surface-variant uppercase">Status</label>
          <div className="flex gap-1 bg-surface-container-low border border-outline-variant rounded p-1">
            {["Wszystkie", "OPEN", "CLOSED"].map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded font-mono text-[10px] uppercase transition-colors ${statusFilter === s ? "bg-surface-container-highest text-on-surface font-bold" : "text-on-surface-variant hover:text-on-surface"}`}>
                {s === "OPEN" ? "Otwarte" : s === "CLOSED" ? "Zamknięte" : s}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-[10px] text-on-surface-variant uppercase">Instrument</label>
          <select value={instrumentFilter} onChange={(e) => setInstrumentFilter(e.target.value)}
            className="bg-surface-container-low border border-outline-variant rounded px-3 py-2 text-on-surface text-sm focus:border-primary focus:outline-none">
            {instruments.map((i) => <option key={i}>{i}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-[10px] text-on-surface-variant uppercase">Strategia</label>
          <select value={strategyFilter} onChange={(e) => setStrategyFilter(e.target.value)}
            className="bg-surface-container-low border border-outline-variant rounded px-3 py-2 text-on-surface text-sm focus:border-primary focus:outline-none">
            {strategies.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-[10px] text-on-surface-variant uppercase">Kierunek</label>
          <div className="flex gap-1 bg-surface-container-low border border-outline-variant rounded p-1">
            {["Wszystkie", "LONG", "SHORT"].map((d) => (
              <button key={d} onClick={() => setDirectionFilter(d)}
                className={`px-3 py-1 rounded font-mono text-[10px] uppercase transition-colors ${directionFilter === d ? "bg-surface-container-highest text-on-surface font-bold" : "text-on-surface-variant hover:text-on-surface"}`}>
                {d}
              </button>
            ))}
          </div>
        </div>
        <button onClick={() => { setInstrumentFilter("Wszystkie"); setStrategyFilter("Wszystkie"); setDirectionFilter("Wszystkie"); setStatusFilter("Wszystkie"); }}
          className="px-4 py-2 border border-outline-variant rounded text-on-surface-variant hover:text-on-surface hover:border-outline text-sm transition-colors flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px]">filter_list_off</span>
          Wyczyść
        </button>
      </div>

      {/* Tabela */}
      <div className="bg-surface-container rounded-lg border border-outline-variant overflow-hidden">
        {enriched.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="material-symbols-outlined text-[48px] text-on-surface-variant mb-3">receipt_long</span>
            <p className="text-on-surface-variant">Brak transakcji spełniających kryteria.</p>
            <Link href="/new" className="mt-4 bg-primary text-on-primary px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-fixed-dim transition-colors">
              Dodaj Transakcję
            </Link>
          </div>
        ) : (
          <>
            <table className="w-full text-left">
              <thead className="bg-surface-container-low border-b border-outline-variant">
                <tr>
                  {["Data / Czas", "Instrument", "Kierunek", "Wejście", "Wyjście / Live", "R-Multiple", "P&L", "Strategia / Tagi", ""].map((h) => (
                    <th key={h} className="font-mono text-[10px] text-on-surface-variant py-3 px-4 font-medium uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/50">
                {enriched.map((trade) => {
                  const isProfit = (trade.displayPnl ?? 0) > 0;
                  const date = new Date(trade.entry_time);
                  const pnlColor = trade.displayPnl !== null
                    ? isProfit ? "text-secondary" : "text-tertiary-container"
                    : "text-on-surface-variant";

                  return (
                    <tr key={trade.id} className={`hover:bg-surface-container-high/50 transition-colors ${trade.status === "OPEN" ? "border-l-2 border-l-primary" : ""}`}>
                      <td className="py-3 px-4">
                        <div className="font-mono text-xs text-on-surface">{date.toLocaleDateString("pl-PL")}</div>
                        <div className="font-mono text-[10px] text-on-surface-variant">
                          {date.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                        {trade.status === "OPEN" && (
                          <span className="font-mono text-[9px] text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20 mt-1 inline-block">OPEN</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm font-semibold text-on-surface">{trade.instrument}</span>
                      </td>
                      <td className="py-3 px-4">
                        <DirectionBadge direction={trade.direction} />
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-xs text-on-surface">
                        {trade.entry_price}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-xs">
                        {trade.status === "CLOSED" ? (
                          <span className="text-on-surface">{trade.exit_price ?? "—"}</span>
                        ) : trade.isLive ? (
                          <div>
                            <span className="text-on-surface">{(trade as { livePrice?: number }).livePrice}</span>
                            <div className="flex items-center justify-end gap-1 mt-0.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse inline-block"></span>
                              <span className="font-mono text-[9px] text-secondary">LIVE</span>
                            </div>
                          </div>
                        ) : liveLoading ? (
                          <span className="material-symbols-outlined text-[14px] text-on-surface-variant animate-spin">progress_activity</span>
                        ) : (
                          <span className="text-on-surface-variant">—</span>
                        )}
                      </td>
                      <td className={`py-3 px-4 text-right font-mono text-sm font-bold ${pnlColor}`}>
                        {trade.displayR !== null && trade.displayR !== undefined
                          ? `${trade.displayR >= 0 ? "+" : ""}${trade.displayR}R`
                          : "—"}
                        {trade.isLive && trade.displayR !== null && (
                          <div className="font-mono text-[9px] text-on-surface-variant font-normal">niezreal.</div>
                        )}
                      </td>
                      <td className={`py-3 px-4 text-right font-mono text-sm font-bold ${pnlColor}`}>
                        {trade.displayPnl !== null && trade.displayPnl !== undefined
                          ? `${trade.displayPnl >= 0 ? "+" : ""}$${Math.abs(trade.displayPnl).toLocaleString("pl-PL")}`
                          : "—"}
                        {trade.isLive && trade.displayPnl !== null && (
                          <div className="font-mono text-[9px] text-on-surface-variant font-normal">niezreal.</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-xs text-on-surface mb-1">{trade.strategy_name ?? "—"}</div>
                        <div className="flex gap-1 flex-wrap">
                          {(trade.tags ?? []).slice(0, 2).map((tag) => (
                            <TagBadge key={tag.name} tag={tag.name} />
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-center gap-2">
                          <Link href={`/log/${trade.id}`} className="text-on-surface-variant hover:text-primary transition-colors" title="Szczegóły">
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
              <span className="font-mono text-xs text-on-surface-variant">
                Pokazano {enriched.length} z {initialTrades.length} transakcji
                {openCount > 0 && ` · ${openCount} otwartych (P&L na żywo z Bybit)`}
              </span>
            </div>
          </>
        )}
      </div>
    </>
  );
}
