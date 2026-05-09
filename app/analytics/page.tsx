import AppShell from "../components/AppShell";
import DisciplineChart from "./DisciplineChart";
import { getAnalyticsData } from "../lib/supabase/queries";

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <span className="material-symbols-outlined text-[36px] text-on-surface-variant mb-2">query_stats</span>
      <p className="text-sm text-on-surface-variant">{label}</p>
    </div>
  );
}

export default async function AnalyticsPage() {
  const { stratStats, tagCosts, instrumentStats, weeklyData, hourlyData, kpis, maxDrawdown } = await getAnalyticsData();

  const kpiBar = [
    { label: "Expectancy", value: `${kpis.expectancy}R`, color: (kpis.expectancy ?? 0) > 0 ? "text-secondary" : "text-tertiary-container" },
    { label: "Profit Factor", value: `${kpis.profitFactor}`, color: kpis.profitFactor >= 1.5 ? "text-secondary" : kpis.profitFactor >= 1 ? "text-primary" : "text-tertiary-container" },
    { label: "Win Rate", value: `${kpis.winRate}%`, color: kpis.winRate >= 50 ? "text-secondary" : "text-tertiary-container" },
    { label: "Max Drawdown", value: `-${maxDrawdown}%`, color: maxDrawdown > 10 ? "text-error" : "text-tertiary-container" },
    { label: "Łączne Transakcje", value: `${kpis.totalTrades}`, color: "text-on-surface" },
  ];

  // Widoczne godziny (tylko handlowe, 6-23)
  const tradingHours = hourlyData.filter((h) => h.hour >= 6 && h.hour <= 22);

  return (
    <AppShell title="Analytics">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-semibold text-on-surface">Analiza Strategii & Statystyki</h2>
          <p className="text-on-surface-variant mt-1">Dane z Twojego dziennika transakcyjnego.</p>
        </div>
      </div>

      {/* KPI bar */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {kpiBar.map(({ label, value, color }) => (
          <div key={label} className="bg-surface-container-low border border-outline-variant rounded-lg p-4">
            <p className="font-mono text-[9px] text-on-surface-variant uppercase mb-2">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-5">
        {/* Skuteczność Strategii */}
        <div className="col-span-8 bg-surface-container border border-outline-variant rounded-lg p-6">
          <h3 className="text-lg font-semibold text-on-surface flex items-center gap-2 mb-6 pb-3 border-b border-outline-variant">
            <span className="material-symbols-outlined text-primary text-[20px]">extension</span>
            Skuteczność Strategii
          </h3>
          {stratStats.length === 0 ? (
            <EmptyState label="Brak strategii z transakcjami. Dodaj strategie w Ustawieniach i przypisz je do transakcji." />
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {stratStats.map((s) => {
                const isProfit = s.totalR > 0;
                return (
                  <div key={s.id} className="bg-surface-container-low border border-outline-variant rounded p-4 relative overflow-hidden hover:border-primary transition-colors">
                    <div className={`absolute top-0 left-0 w-1 h-full ${isProfit ? "bg-secondary" : "bg-tertiary-container"}`} />
                    <div className="flex justify-between items-start mb-3 pl-3">
                      <div>
                        <h4 className="text-sm font-semibold text-on-surface">{s.name}</h4>
                        <span className="font-mono text-[9px] text-on-surface-variant uppercase">{s.trades} transakcji</span>
                      </div>
                      <span className={`font-mono text-sm font-bold ${isProfit ? "text-secondary" : "text-tertiary-container"}`}>
                        {isProfit ? "+" : ""}{s.totalR}R
                      </span>
                    </div>
                    {s.trades === 0 ? (
                      <p className="font-mono text-[10px] text-on-surface-variant pl-3">Brak zamkniętych transakcji</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-y-2 gap-x-3 pl-3">
                        {[
                          { label: "Win Rate", value: `${s.winRate}%` },
                          { label: "Profit Factor", value: `${s.profitFactor}` },
                          { label: "Avg R", value: `${s.avgR >= 0 ? "+" : ""}${s.avgR}R`, color: s.avgR >= 0 ? "text-secondary" : "text-tertiary-container" },
                          { label: "Trades", value: `${s.trades}` },
                        ].map(({ label, value, color }) => (
                          <div key={label}>
                            <p className="font-mono text-[9px] text-on-surface-variant uppercase">{label}</p>
                            <p className={`font-mono text-xs mt-0.5 ${color ?? "text-on-surface"}`}>{value}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Koszt Błędów */}
        <div className="col-span-4 bg-surface-container border border-outline-variant rounded-lg p-6">
          <h3 className="text-lg font-semibold text-on-surface flex items-center gap-2 mb-6 pb-3 border-b border-outline-variant">
            <span className="material-symbols-outlined text-tertiary-container text-[20px]">warning</span>
            Koszt Błędów
          </h3>
          {tagCosts.length === 0 ? (
            <EmptyState label="Brak tagów z ujemnym P&L." />
          ) : (
            <div className="flex flex-col gap-5">
              {tagCosts.map((m) => (
                <div key={m.tag}>
                  <div className="flex justify-between items-end mb-1.5">
                    <div>
                      <span className="font-mono text-xs text-on-surface">{m.tag}</span>
                      <span className="font-mono text-[9px] text-on-surface-variant ml-2">({m.count}x)</span>
                    </div>
                    <span className="font-mono text-xs text-tertiary-container font-bold">${m.cost.toFixed(2)}</span>
                  </div>
                  <div className="w-full h-2 bg-surface-container-highest rounded overflow-hidden">
                    <div className="h-full bg-tertiary-container rounded" style={{ width: `${m.pct}%` }} />
                  </div>
                </div>
              ))}
              <div className="pt-3 border-t border-outline-variant">
                <p className="font-mono text-[9px] text-on-surface-variant uppercase mb-1">Łączny Koszt</p>
                <p className="font-mono text-lg font-bold text-tertiary-container">
                  ${tagCosts.reduce((a, m) => a + m.cost, 0).toFixed(2)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Dyscyplina vs Kapitał */}
        <div className="col-span-12 bg-surface-container border border-outline-variant rounded-lg p-6">
          <div className="mb-4 pb-3 border-b border-outline-variant">
            <h3 className="text-lg font-semibold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">psychology</span>
              Dyscyplina vs. Kapitał (tygodniowo)
            </h3>
            <p className="font-mono text-[10px] text-on-surface-variant mt-1 uppercase">
              Słupki tła = % dyscypliny | Słupki P&L = tygodniowy wynik w $
            </p>
          </div>
          <DisciplineChart data={weeklyData} />
        </div>

        {/* Wyniki per instrument */}
        <div className="col-span-6 bg-surface-container border border-outline-variant rounded-lg p-6">
          <h3 className="text-lg font-semibold text-on-surface flex items-center gap-2 mb-4 pb-3 border-b border-outline-variant">
            <span className="material-symbols-outlined text-primary text-[20px]">bar_chart</span>
            Wyniki Wg Instrumentu
          </h3>
          {instrumentStats.length === 0 ? (
            <EmptyState label="Brak zamkniętych transakcji." />
          ) : (
            <div className="flex flex-col gap-3">
              {instrumentStats.map(({ instrument, totalR, trades, pct }) => {
                const isPos = totalR >= 0;
                return (
                  <div key={instrument}>
                    <div className="flex justify-between items-end mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-on-surface font-semibold">{instrument}</span>
                        <span className="font-mono text-[9px] text-on-surface-variant">{trades} transakcji</span>
                      </div>
                      <span className={`font-mono text-sm font-bold ${isPos ? "text-secondary" : "text-tertiary-container"}`}>
                        {isPos ? "+" : ""}{totalR}R
                      </span>
                    </div>
                    <div className="w-full h-2 bg-surface-container-highest rounded overflow-hidden">
                      <div className={`h-full rounded ${isPos ? "bg-secondary" : "bg-tertiary-container"}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Heatmapa godzinowa */}
        <div className="col-span-6 bg-surface-container border border-outline-variant rounded-lg p-6">
          <h3 className="text-lg font-semibold text-on-surface flex items-center gap-2 mb-4 pb-3 border-b border-outline-variant">
            <span className="material-symbols-outlined text-primary text-[20px]">schedule</span>
            P&L Wg Pory Dnia
          </h3>
          {tradingHours.every((h) => h.count === 0) ? (
            <EmptyState label="Brak danych — dodaj transakcje z czasem wejścia." />
          ) : (
            <>
              <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${tradingHours.length}, 1fr)` }}>
                {tradingHours.map((h) => (
                  <div key={h.hour} className="text-center" title={`${h.label}: ${h.pnl >= 0 ? "+" : ""}$${h.pnl} (${h.count} transakcji)`}>
                    <div
                      className="w-full aspect-square rounded mb-1"
                      style={{
                        background: h.count === 0
                          ? "#222a3d"
                          : h.isPositive
                          ? `rgba(78,222,163,${0.15 + h.intensity * 0.75})`
                          : `rgba(255,81,106,${0.15 + h.intensity * 0.75})`,
                      }}
                    />
                    <span className="font-mono text-[8px] text-on-surface-variant">{h.hour}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded" style={{ background: "rgba(78,222,163,0.7)" }} />
                  <span className="font-mono text-[9px] text-on-surface-variant">Zysk</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded" style={{ background: "rgba(255,81,106,0.7)" }} />
                  <span className="font-mono text-[9px] text-on-surface-variant">Strata</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-surface-container-high" />
                  <span className="font-mono text-[9px] text-on-surface-variant">Brak transakcji</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
