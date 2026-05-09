import AppShell from "../components/AppShell";
import { STRATEGIES, MISTAKE_COSTS, KPI } from "../lib/mock-data";
import DisciplineChart from "./DisciplineChart";

function StrategyCard({ strategy }: { strategy: (typeof STRATEGIES)[0] }) {
  const isProfit = strategy.totalR > 0;
  return (
    <div className="bg-surface-container-low border border-outline-variant rounded p-4 relative overflow-hidden hover:border-primary transition-colors cursor-pointer">
      <div className="absolute top-0 left-0 w-1 h-full bg-secondary" />
      <div className="flex justify-between items-start mb-4 pl-3">
        <div>
          <h4 className="text-base font-semibold text-on-surface">{strategy.name}</h4>
          <span className="inline-block mt-1 px-2 py-0.5 bg-surface-container text-on-surface-variant font-mono text-[9px] uppercase rounded tracking-wider">
            {strategy.type}
          </span>
        </div>
        <span className={`font-mono text-sm font-bold ${isProfit ? "text-secondary" : "text-tertiary-container"}`}>
          {isProfit ? "+" : ""}{strategy.totalR}R
        </span>
      </div>
      <div className="grid grid-cols-2 gap-y-3 gap-x-4 pl-3">
        <div>
          <p className="font-mono text-[9px] text-on-surface-variant uppercase">Win Rate</p>
          <p className="font-mono text-sm text-on-surface mt-0.5">{strategy.winRate}%</p>
        </div>
        <div>
          <p className="font-mono text-[9px] text-on-surface-variant uppercase">Profit Factor</p>
          <p className="font-mono text-sm text-on-surface mt-0.5">{strategy.profitFactor}</p>
        </div>
        <div>
          <p className="font-mono text-[9px] text-on-surface-variant uppercase">Avg R</p>
          <p className={`font-mono text-sm mt-0.5 ${strategy.avgR > 0 ? "text-secondary" : "text-tertiary-container"}`}>
            {strategy.avgR > 0 ? "+" : ""}{strategy.avgR}R
          </p>
        </div>
        <div>
          <p className="font-mono text-[9px] text-on-surface-variant uppercase">Trades</p>
          <p className="font-mono text-sm text-on-surface mt-0.5">{strategy.trades}</p>
        </div>
      </div>
    </div>
  );
}

function MistakeBar({ mistake }: { mistake: (typeof MISTAKE_COSTS)[0] }) {
  return (
    <div>
      <div className="flex justify-between items-end mb-1.5">
        <span className="font-mono text-xs text-on-surface">{mistake.tag}</span>
        <span className="font-mono text-xs text-tertiary-container">{mistake.cost}R</span>
      </div>
      <div className="w-full h-2 bg-surface-container-highest rounded overflow-hidden">
        <div
          className="h-full bg-tertiary-container rounded transition-all duration-500"
          style={{ width: `${mistake.pct}%` }}
        />
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <AppShell title="Analytics">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-semibold text-on-surface">Analiza Strategii & Statystyki</h2>
          <p className="text-on-surface-variant mt-1">Kompleksowy przegląd skuteczności i dyscypliny operacyjnej.</p>
        </div>
        <div className="flex items-center gap-1 bg-surface-container-low border border-outline-variant rounded p-1">
          {["30D", "90D", "YTD", "ALL"].map((period) => (
            <button
              key={period}
              className={`px-3 py-1.5 font-mono text-[10px] uppercase rounded transition-colors ${
                period === "YTD"
                  ? "bg-surface-container-highest text-primary font-bold"
                  : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* Overall KPI Bar */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {[
          { label: "Expectancy", value: `${KPI.expectancy}R`, color: "text-primary" },
          { label: "Profit Factor", value: `${KPI.profitFactor}`, color: "text-primary" },
          { label: "Win Rate", value: `${KPI.winRate}%`, color: "text-secondary" },
          { label: "Max Drawdown", value: `${KPI.maxDrawdown}%`, color: "text-error" },
          { label: "Sharpe Ratio", value: `${KPI.sharpeRatio}`, color: "text-primary" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-surface-container-low border border-outline-variant rounded-lg p-4">
            <p className="font-mono text-[9px] text-on-surface-variant uppercase mb-2">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-5">
        {/* Strategy Comparison */}
        <div className="col-span-8 bg-surface-container border border-outline-variant rounded-lg p-6">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-outline-variant">
            <h3 className="text-lg font-semibold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">extension</span>
              Skuteczność Strategii
            </h3>
            <button className="text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined">more_horiz</span>
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {STRATEGIES.map((s) => (
              <StrategyCard key={s.id} strategy={s} />
            ))}
          </div>
        </div>

        {/* Mistake Costs */}
        <div className="col-span-4 bg-surface-container border border-outline-variant rounded-lg p-6">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-outline-variant">
            <h3 className="text-lg font-semibold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary-container text-[20px]">warning</span>
              Koszt Błędów
            </h3>
          </div>
          <div className="flex flex-col gap-5">
            {MISTAKE_COSTS.map((m) => (
              <MistakeBar key={m.tag} mistake={m} />
            ))}
          </div>
          <div className="mt-5 pt-4 border-t border-outline-variant">
            <p className="font-mono text-[10px] text-on-surface-variant uppercase mb-1">Łączny Koszt Błędów</p>
            <p className="font-mono text-xl font-bold text-tertiary-container">
              {MISTAKE_COSTS.reduce((a, m) => a + m.cost, 0).toFixed(1)}R
            </p>
          </div>
        </div>

        {/* Discipline vs Capital Chart */}
        <div className="col-span-12 bg-surface-container border border-outline-variant rounded-lg p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-outline-variant">
            <div>
              <h3 className="text-lg font-semibold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">psychology</span>
                Dyscyplina vs. Kapitał
              </h3>
              <p className="font-mono text-[10px] text-on-surface-variant mt-1 uppercase">
                Korelacja przestrzegania zasad ze wzrostem PnL
              </p>
            </div>
          </div>
          <DisciplineChart />
        </div>

        {/* Time of Day Heatmap */}
        <div className="col-span-6 bg-surface-container border border-outline-variant rounded-lg p-6">
          <h3 className="text-lg font-semibold text-on-surface flex items-center gap-2 mb-4 pb-3 border-b border-outline-variant">
            <span className="material-symbols-outlined text-primary text-[20px]">schedule</span>
            Skuteczność Wg Pory Dnia
          </h3>
          <div className="grid grid-cols-8 gap-1">
            {["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00"].map((h) => (
              <div key={h} className="text-center">
                <div
                  className="w-full aspect-square rounded mb-1"
                  style={{
                    background: `rgba(78, 222, 163, ${Math.random() * 0.8 + 0.1})`,
                  }}
                />
                <span className="font-mono text-[8px] text-on-surface-variant">{h}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-3">
            <div className="w-3 h-3 rounded bg-secondary/20" />
            <span className="font-mono text-[10px] text-on-surface-variant">Słaba efektywność</span>
            <div className="w-3 h-3 rounded bg-secondary ml-2" />
            <span className="font-mono text-[10px] text-on-surface-variant">Wysoka efektywność</span>
          </div>
        </div>

        {/* Instrument Performance */}
        <div className="col-span-6 bg-surface-container border border-outline-variant rounded-lg p-6">
          <h3 className="text-lg font-semibold text-on-surface flex items-center gap-2 mb-4 pb-3 border-b border-outline-variant">
            <span className="material-symbols-outlined text-primary text-[20px]">bar_chart</span>
            Wyniki Wg Instrumentu
          </h3>
          <div className="flex flex-col gap-3">
            {[
              { instrument: "EUR/USD", r: "+12.8R", pct: 85, trades: 48 },
              { instrument: "NQ1!", r: "+8.4R", pct: 65, trades: 32 },
              { instrument: "ES1!", r: "+3.2R", pct: 45, trades: 28 },
              { instrument: "GC1!", r: "-1.4R", pct: 15, trades: 14 },
            ].map(({ instrument, r, pct, trades }) => {
              const isPos = r.startsWith("+");
              return (
                <div key={instrument}>
                  <div className="flex justify-between items-end mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-on-surface font-semibold">{instrument}</span>
                      <span className="font-mono text-[10px] text-on-surface-variant">{trades} transakcji</span>
                    </div>
                    <span className={`font-mono text-sm font-bold ${isPos ? "text-secondary" : "text-tertiary-container"}`}>
                      {r}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-surface-container-highest rounded overflow-hidden">
                    <div
                      className={`h-full rounded ${isPos ? "bg-secondary" : "bg-tertiary-container"}`}
                      style={{ width: `${Math.abs(pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
