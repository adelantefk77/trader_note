import AppShell from "../components/AppShell";
import EquityChartWrapper from "../components/EquityChartWrapper";
import DisciplineCalendar from "../components/DisciplineCalendar";
import Link from "next/link";
import { getDashboardData } from "../lib/supabase/queries";

function KPICard({
  label, value, delta, deltaPositive, icon, accentLeft, note,
}: {
  label: string; value: string; delta?: string; deltaPositive?: boolean;
  icon: string; accentLeft?: boolean; note?: string;
}) {
  return (
    <div className={`bg-surface-container-low border border-outline-variant rounded-lg p-6 ${accentLeft ? "border-l-4 border-l-secondary" : ""}`}>
      <div className="flex justify-between items-start mb-3">
        <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest">{label}</span>
        <span className="material-symbols-outlined text-[18px] text-primary">{icon}</span>
      </div>
      <div className="text-4xl font-bold text-on-surface tracking-tight">{value}</div>
      {delta && (
        <div className={`font-mono text-[11px] mt-2 flex items-center gap-1 ${deltaPositive ? "text-secondary" : "text-error"}`}>
          <span className="material-symbols-outlined text-[13px]">{deltaPositive ? "arrow_upward" : "arrow_downward"}</span>
          {delta}
        </div>
      )}
      {note && <div className="font-mono text-[11px] text-on-surface-variant mt-2">{note}</div>}
    </div>
  );
}

export default async function DashboardPage() {
  const { trades, kpis, equityPoints } = await getDashboardData();
  const recentTrades = trades.slice(0, 4);

  return (
    <AppShell title="Dashboard">
      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-5 mb-8">
        <KPICard label="Oczekiwana Wartość (R)" value={`${kpis.expectancy}R`} icon="trending_up" />
        <KPICard label="Kroczący Profit Factor" value={`${kpis.profitFactor}`} icon="balance" />
        <KPICard label="Łączne Transakcje" value={`${kpis.totalTrades}`} note="Historia konta" icon="receipt_long" />
        <KPICard label="Win Rate" value={`${kpis.winRate}%`} icon="fact_check" accentLeft={kpis.winRate >= 50} />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-5">
        {/* Equity Curve */}
        <div className="col-span-8 bg-surface-container-low border border-outline-variant rounded-lg p-6 flex flex-col h-[480px]">
          <div className="flex justify-between items-center mb-6 pb-3 border-b border-outline-variant">
            <h2 className="text-xl font-semibold text-on-surface">Krzywa Kapitału</h2>
            <div className="flex gap-1 bg-surface-container p-1 rounded border border-outline-variant">
              {["1M", "3M", "YTD", "ALL"].map((p) => (
                <button key={p} className={`px-3 py-1 font-mono text-xs rounded transition-colors ${p === "ALL" ? "bg-surface-container-highest text-on-surface font-bold" : "text-on-surface-variant hover:text-on-surface"}`}>{p}</button>
              ))}
            </div>
          </div>
          <div className="flex-1">
            <EquityChartWrapper data={equityPoints} />
          </div>
        </div>

        {/* Right Column */}
        <div className="col-span-4 flex flex-col gap-5 h-[480px]">
          <div className="bg-surface-container-low border border-outline-variant rounded-lg p-5 flex-1">
            <h3 className="text-base font-semibold text-on-surface mb-3 pb-2 border-b border-outline-variant">Dyscyplina (Zgodność)</h3>
            <DisciplineCalendar trades={trades} />
          </div>

          <div className="bg-surface-container-low border border-outline-variant rounded-lg p-5 flex-1 flex flex-col overflow-hidden">
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-outline-variant">
              <h3 className="text-base font-semibold text-on-surface">Ostatnie Transakcje</h3>
              <Link href="/log" className="font-mono text-[10px] text-primary hover:text-primary-fixed-dim uppercase">Pokaż wszystkie →</Link>
            </div>
            <div className="flex flex-col gap-2 overflow-y-auto">
              {recentTrades.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <span className="material-symbols-outlined text-[32px] text-on-surface-variant mb-2">receipt_long</span>
                  <p className="text-sm text-on-surface-variant">Brak transakcji. Dodaj pierwszą!</p>
                  <Link href="/new" className="mt-3 font-mono text-xs text-primary hover:text-primary-fixed-dim">+ Nowa Transakcja</Link>
                </div>
              ) : (
                recentTrades.map((trade) => {
                  const isProfit = (trade.pnl ?? 0) > 0;
                  return (
                    <Link key={trade.id} href={`/log/${trade.id}`} className="flex items-center justify-between p-3 bg-surface-container rounded border border-outline-variant hover:border-outline transition-colors">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold border ${trade.direction === "LONG" ? "bg-secondary/10 text-secondary border-secondary/20" : "bg-tertiary-container/10 text-tertiary-container border-tertiary-container/20"}`}>
                          {trade.direction}
                        </span>
                        <span className="font-mono text-sm text-on-surface font-semibold">{trade.instrument}</span>
                      </div>
                      <div className="text-right">
                        <div className={`font-mono text-sm font-bold ${isProfit ? "text-secondary" : "text-tertiary-container"}`}>
                          {trade.rMultiple !== null ? `${isProfit ? "+" : ""}${trade.rMultiple}R` : "—"}
                        </div>
                        <div className="font-mono text-[10px] text-on-surface-variant">
                          {trade.pnl !== null ? `${isProfit ? "+" : ""}$${Math.abs(trade.pnl).toLocaleString("pl-PL")}` : "—"}
                        </div>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-5 mt-5">
        <div className="bg-surface-container-low border border-outline-variant rounded-lg p-5">
          <p className="font-mono text-[10px] text-on-surface-variant uppercase mb-2">Win Rate</p>
          <p className="text-2xl font-bold text-on-surface">{kpis.winRate}%</p>
          <div className="mt-3 h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: `${kpis.winRate}%` }} />
          </div>
        </div>
        <div className="bg-surface-container-low border border-outline-variant rounded-lg p-5">
          <p className="font-mono text-[10px] text-on-surface-variant uppercase mb-2">Profit Factor</p>
          <p className={`text-2xl font-bold ${kpis.profitFactor >= 1.5 ? "text-secondary" : kpis.profitFactor >= 1 ? "text-primary" : "text-tertiary-container"}`}>
            {kpis.profitFactor}
          </p>
          <p className="font-mono text-[10px] text-on-surface-variant mt-2">
            {kpis.profitFactor >= 1.5 ? "▲ Solidna krawędź" : kpis.profitFactor >= 1 ? "→ Cienki lód" : "▼ Krwawienie kapitału"}
          </p>
        </div>
        <div className="bg-surface-container-low border border-outline-variant rounded-lg p-5">
          <p className="font-mono text-[10px] text-on-surface-variant uppercase mb-2">Expectancy</p>
          <p className={`text-2xl font-bold ${(kpis.expectancy ?? 0) > 0 ? "text-secondary" : "text-tertiary-container"}`}>
            {kpis.expectancy}R
          </p>
          <p className="font-mono text-[10px] text-on-surface-variant mt-2">Na transakcję</p>
        </div>
      </div>
    </AppShell>
  );
}
