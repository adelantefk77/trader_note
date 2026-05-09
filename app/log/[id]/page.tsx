import Link from "next/link";
import { getTradeById } from "../../lib/supabase/queries";
import { notFound } from "next/navigation";
import { deleteTrade } from "../../new/actions";

function DataRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-outline-variant/30">
      <span className="font-mono text-[10px] text-on-surface-variant uppercase">{label}</span>
      <span className={`font-mono text-xs ${valueColor ?? "text-on-surface"}`}>{value}</span>
    </div>
  );
}

const ERROR_TAGS = ["FOMO", "Revenge Trading", "Oversize", "Hesitation"];
const QUALITY_TAGS = ["A-Setup", "Zgodnie z Planem", "Cierpliwość", "Skupienie"];

export default async function TradeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let trade;
  try {
    trade = await getTradeById(id);
  } catch {
    notFound();
  }

  const isProfit = (trade.pnl ?? 0) > 0;
  const entryDate = new Date(trade.entry_time);
  const exitDate = trade.exit_time ? new Date(trade.exit_time) : null;

  const durationMs = exitDate ? exitDate.getTime() - entryDate.getTime() : 0;
  const durationHours = Math.floor(durationMs / 3600000);
  const durationMins = Math.floor((durationMs % 3600000) / 60000);

  const tags: { id: string; name: string; category: string }[] = trade.tags ?? [];
  const errorTagCount = tags.filter((t) => ERROR_TAGS.includes(t.name)).length;
  const adherence = tags.length > 0 ? Math.round(((tags.length - errorTagCount) / tags.length) * 100) : 95;

  return (
    <div className="flex min-h-screen bg-background text-on-surface">
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="glass-panel bg-surface/80 backdrop-blur-md border-b border-outline-variant sticky top-0 z-40 h-16 flex items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <Link href="/log" className="flex items-center gap-1.5 text-on-surface-variant hover:text-on-surface transition-colors font-mono text-xs">
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Wróć do Logu
            </Link>
            <div className="h-5 w-px bg-outline-variant mx-2" />
            <h1 className="text-lg font-semibold text-on-surface">{trade.instrument}</h1>
            <span className={`px-3 py-1 rounded font-mono text-[10px] border ${trade.status === "CLOSED" ? "bg-surface-container-high text-on-surface border-outline-variant" : "bg-secondary/10 text-secondary border-secondary/20"}`}>
              {trade.status === "CLOSED" ? "Zamknięta" : "Aktywna"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <form action={deleteTrade.bind(null, trade.id)}>
              <button type="submit" className="flex items-center gap-2 px-4 py-2 border border-error/30 rounded-lg text-error hover:bg-error/10 transition-colors font-mono text-xs">
                <span className="material-symbols-outlined text-[16px]">delete</span>
                Usuń
              </button>
            </form>
          </div>
        </header>

        <div className="p-8 grid grid-cols-12 gap-5 max-w-[1600px] mx-auto w-full">
          {/* Left 8 cols */}
          <div className="col-span-8 flex flex-col gap-5">
            {/* Hero */}
            <div className="bg-surface-container-low border border-outline-variant rounded-xl p-6 flex flex-wrap items-start justify-between gap-6">
              <div>
                <span className="font-mono text-[10px] text-on-surface-variant uppercase">Instrument</span>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-4xl font-bold text-on-surface">{trade.instrument}</span>
                  <span className={`px-3 py-1 rounded font-mono text-xs font-bold ${trade.direction === "LONG" ? "bg-secondary/20 text-secondary" : "bg-tertiary-container/20 text-tertiary-container"}`}>{trade.direction}</span>
                </div>
              </div>
              <div className="h-14 w-px bg-outline-variant hidden lg:block" />
              <div>
                <span className="font-mono text-[10px] text-on-surface-variant uppercase">Wynik (R)</span>
                <p className={`text-4xl font-bold mt-1 ${trade.rMultiple !== null ? (isProfit ? "text-secondary" : "text-tertiary-container") : "text-on-surface-variant"}`}>
                  {trade.rMultiple !== null ? `${isProfit ? "+" : ""}${trade.rMultiple}R` : "Aktywna"}
                </p>
              </div>
              <div className="h-14 w-px bg-outline-variant hidden lg:block" />
              <div>
                <span className="font-mono text-[10px] text-on-surface-variant uppercase">P&L</span>
                <p className={`text-4xl font-bold mt-1 ${trade.pnl !== null ? (isProfit ? "text-secondary" : "text-tertiary-container") : "text-on-surface-variant"}`}>
                  {trade.pnl !== null ? `${isProfit ? "+" : ""}$${Math.abs(trade.pnl).toLocaleString("pl-PL")}` : "—"}
                </p>
              </div>
              {exitDate && (
                <>
                  <div className="h-14 w-px bg-outline-variant hidden lg:block" />
                  <div>
                    <span className="font-mono text-[10px] text-on-surface-variant uppercase">Czas Trwania</span>
                    <p className="text-2xl font-bold text-on-surface mt-1">{durationHours}h {durationMins}m</p>
                  </div>
                </>
              )}
            </div>

            {/* Visual Analysis */}
            <div className="bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden">
              <div className="p-5 border-b border-outline-variant">
                <h2 className="text-lg font-semibold text-on-surface">Analiza Wizualna</h2>
              </div>
              <div className="grid grid-cols-2 divide-x divide-outline-variant">
                {(["BEFORE_ENTRY", "AFTER_EXIT"] as const).map((phase) => {
                  const screenshot = (trade.screenshots ?? []).find((s: { phase: string; storage_path: string }) => s.phase === phase);
                  return (
                    <div key={phase} className="flex flex-col">
                      <div className="px-4 py-2 bg-surface-container border-b border-outline-variant flex justify-between">
                        <span className="font-mono text-[10px] text-on-surface">{phase === "BEFORE_ENTRY" ? "Przed Wejściem" : "Po Wyjściu"}</span>
                        <span className="font-mono text-[10px] text-on-surface-variant">
                          {phase === "BEFORE_ENTRY" ? entryDate.toLocaleDateString("pl-PL") : exitDate?.toLocaleDateString("pl-PL") ?? "—"}
                        </span>
                      </div>
                      <div className="aspect-video bg-surface-container-highest flex items-center justify-center">
                        {screenshot ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={screenshot.storage_path} alt={phase} className="w-full h-full object-contain" />
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-on-surface-variant">
                            <span className="material-symbols-outlined text-[40px]">add_photo_alternate</span>
                            <span className="font-mono text-[10px]">Brak screenshota</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Behavioral Mirror */}
            <div className="bg-surface-container-low border border-outline-variant rounded-xl p-6">
              <h2 className="text-lg font-semibold text-on-surface mb-5 pb-3 border-b border-outline-variant">Lustro Behawioralne & Notatki</h2>
              <div className="grid grid-cols-2 gap-6 mb-5">
                <div>
                  <p className="font-mono text-[10px] text-on-surface-variant mb-3 uppercase">Tagi</p>
                  <div className="flex flex-wrap gap-2">
                    {tags.length === 0 ? (
                      <span className="font-mono text-xs text-on-surface-variant">Brak tagów</span>
                    ) : (
                      tags.map((tag) => (
                        <span key={tag.id} className="flex items-center gap-1 px-3 py-1 rounded bg-surface-container-high text-on-surface font-mono text-xs border border-outline-variant/50">
                          <span className={`material-symbols-outlined text-[14px] ${ERROR_TAGS.includes(tag.name) ? "text-tertiary-container" : QUALITY_TAGS.includes(tag.name) ? "text-secondary" : "text-primary"}`}>
                            {ERROR_TAGS.includes(tag.name) ? "warning" : QUALITY_TAGS.includes(tag.name) ? "check_circle" : "psychology"}
                          </span>
                          {tag.name}
                        </span>
                      ))
                    )}
                  </div>
                </div>
                <div>
                  <p className="font-mono text-[10px] text-on-surface-variant mb-3 uppercase">Strategia</p>
                  <span className="px-3 py-1 rounded bg-surface-container-high text-on-surface font-mono text-xs border border-outline-variant/50">
                    {trade.strategy_name ?? "Brak przypisanej strategii"}
                  </span>
                </div>
              </div>
              <div className="bg-surface-container rounded-lg p-4 border border-outline-variant min-h-[80px]">
                <p className="text-sm text-on-surface-variant leading-relaxed">{trade.notes || "Brak notatek."}</p>
              </div>
            </div>
          </div>

          {/* Right 4 cols */}
          <div className="col-span-4 flex flex-col gap-5">
            {/* Technical Data */}
            <div className="bg-surface-container-low border border-outline-variant rounded-xl p-6">
              <h3 className="text-lg font-semibold text-on-surface mb-4 pb-3 border-b border-outline-variant">Dane Techniczne</h3>
              <div className="flex flex-col">
                <DataRow label="Wejście" value={String(trade.entry_price)} />
                <DataRow label="Wyjście" value={trade.exit_price ? String(trade.exit_price) : "Aktywna"} />
                <DataRow label="Stop Loss" value={String(trade.stop_loss)} valueColor="text-tertiary-container" />
                <DataRow label="Take Profit" value={trade.take_profit ? String(trade.take_profit) : "—"} valueColor="text-secondary" />
                <DataRow label="Wielkość Pozycji" value={`${trade.position_size}`} />
                <DataRow label="Prowizje/Swapy" value={`-$${trade.commission_fees}`} valueColor="text-on-surface-variant" />
                <DataRow label="Czas Trwania" value={exitDate ? `${durationHours}h ${durationMins}m` : "Aktywna"} />
                <DataRow label="Strategia" value={trade.strategy_name ?? "—"} />
              </div>
            </div>

            {/* Impact */}
            <div className="bg-surface-container-high border border-outline-variant rounded-xl p-6">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-on-surface mb-5 pb-3 border-b border-outline-variant">
                <span className="material-symbols-outlined text-primary text-[20px]">analytics</span>
                Wpływ na Strategię
              </h3>
              <div className="flex flex-col gap-5">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-mono text-[10px] text-on-surface-variant uppercase">Jakość Setupu</span>
                    <span className="font-mono text-xs text-on-surface font-bold">{adherence >= 90 ? "A+" : adherence >= 70 ? "B" : "C"}</span>
                  </div>
                  <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${adherence}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-mono text-[10px] text-on-surface-variant uppercase">Zgodność z planem</span>
                    <span className="font-mono text-xs text-on-surface font-bold">{adherence}%</span>
                  </div>
                  <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${adherence >= 80 ? "bg-secondary" : "bg-error"}`} style={{ width: `${adherence}%` }} />
                  </div>
                </div>
                <div className="bg-surface-container-low p-4 rounded-lg border border-outline-variant">
                  <p className="text-xs text-on-surface-variant">
                    {trade.rMultiple !== null
                      ? isProfit
                        ? <>Ta transakcja poprawiła expectancy o <strong className="text-secondary">+{Math.abs(Math.round((trade.rMultiple ?? 0) * 5) / 100)}R</strong>.</>
                        : <>Ta transakcja obniżyła expectancy o <strong className="text-tertiary-container">{Math.round((trade.rMultiple ?? 0) * 5) / 100}R</strong>.</>
                      : "Transakcja wciąż aktywna — expectancy zostanie obliczone po zamknięciu."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
