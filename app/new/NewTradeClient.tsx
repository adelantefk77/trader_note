"use client";

import { useState, useTransition } from "react";
import { createTrade } from "./actions";

interface Strategy { id: string; name: string; }
interface Tag { id: string; name: string; category: string; }

function calcRR(direction: "LONG" | "SHORT", entry: number, sl: number, tp: number, size: number, accountSize: number) {
  if (!entry || !sl || !tp || !size) return null;
  const riskDist = Math.abs(entry - sl);
  const rewardDist = Math.abs(entry - tp);
  const risk = riskDist * size * 10000;
  const reward = rewardDist * size * 10000;
  const riskPct = accountSize > 0 ? (risk / accountSize) * 100 : 0;
  const rewardPct = accountSize > 0 ? (reward / accountSize) * 100 : 0;
  return { risk, reward, rr: reward / risk, riskPct, rewardPct };
}

const TAG_CATEGORIES: Record<string, string> = {
  MISTAKE: "text-error",
  QUALITY: "text-secondary",
  EMOTION: "text-primary",
  CONDITION: "text-on-surface-variant",
};

export default function NewTradeClient({
  strategies, tags, accountSize = 10000, currency = "USD", riskPerTrade = 1.5,
}: {
  strategies: Strategy[]; tags: Tag[];
  accountSize?: number; currency?: string; riskPerTrade?: number;
}) {
  const [isPending, startTransition] = useTransition();
  const [direction, setDirection] = useState<"LONG" | "SHORT">("LONG");
  const [entryPrice, setEntryPrice] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [positionSize, setPositionSize] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [checklist, setChecklist] = useState({ setup: false, risk: false, macro: false, emotion: false });

  const calc = calcRR(direction, parseFloat(entryPrice), parseFloat(stopLoss), parseFloat(takeProfit), parseFloat(positionSize), accountSize);
  const maxRiskAmount = (accountSize * riskPerTrade) / 100;
  const riskOverLimit = calc && calc.risk > maxRiskAmount;

  const toggleTag = (id: string) =>
    setSelectedTags((prev) => prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]);

  const getRRAlert = (rr: number) => {
    if (rr >= 2) return { cls: "border-l-secondary", text: "Parametry mieszczą się w profilu ryzyka. Możesz kontynuować." };
    if (rr >= 1) return { cls: "border-l-primary", text: "R:R poniżej optymalnego poziomu. Rozważ lepszy punkt wejścia." };
    return { cls: "border-l-tertiary-container", text: "Uwaga: R:R poniżej 1.0. Zagranie nie spełnia minimalnego kryterium." };
  };

  const now = new Date();
  const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

  return (
    <>
      <div className="mb-6">
        <h2 className="text-3xl font-semibold text-on-surface">Nowa Transakcja</h2>
        <p className="text-on-surface-variant mt-1">Wprowadź szczegóły swojej pozycji na rynku.</p>
      </div>

      <form action={createTrade}>
        <input type="hidden" name="direction" value={direction} />
        {selectedTags.map((id) => <input key={id} type="hidden" name="tagIds" value={id} />)}

        <div className="grid grid-cols-12 gap-5">
          {/* Form */}
          <div className="col-span-8 flex flex-col gap-5">
            {/* Market Data */}
            <section className="bg-surface-container rounded-lg border border-outline-variant p-6">
              <h3 className="text-xl font-semibold text-on-surface mb-5 pb-2 border-b border-outline-variant">Dane Rynkowe</h3>
              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2">
                  <label className="block font-mono text-[10px] text-on-surface-variant mb-2 uppercase">Instrument *</label>
                  <input name="instrument" type="text" required placeholder="np. EURUSD, AAPL, BTCUSDT"
                    className="w-full bg-surface-container-highest border-b border-outline-variant focus:border-primary text-on-surface font-mono py-3 px-3 rounded-t focus:outline-none transition-colors" />
                </div>
                <div>
                  <label className="block font-mono text-[10px] text-on-surface-variant mb-2 uppercase">Kierunek</label>
                  <div className="flex gap-3">
                    {(["LONG", "SHORT"] as const).map((d) => (
                      <button type="button" key={d} onClick={() => setDirection(d)}
                        className={`flex-1 py-3 rounded font-mono text-xs font-bold transition-colors border ${
                          direction === d
                            ? d === "LONG" ? "bg-secondary/10 border-secondary text-secondary" : "bg-tertiary-container/10 border-tertiary-container text-tertiary-container"
                            : "bg-surface-container-highest border-outline-variant text-on-surface-variant"
                        }`}>
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block font-mono text-[10px] text-on-surface-variant mb-2 uppercase">Data i Czas Wejścia</label>
                  <input name="entryTime" type="datetime-local" defaultValue={localIso}
                    className="w-full bg-surface-container-highest border-b border-outline-variant focus:border-primary text-on-surface font-mono py-3 px-3 rounded-t focus:outline-none transition-colors" />
                </div>
                <div>
                  <label className="block font-mono text-[10px] text-on-surface-variant mb-2 uppercase">Cena Wejścia *</label>
                  <input name="entryPrice" type="number" step="any" required placeholder="0.00000" value={entryPrice} onChange={(e) => setEntryPrice(e.target.value)}
                    className="w-full bg-surface-container-highest border-b border-outline-variant focus:border-primary text-on-surface font-mono py-3 px-3 rounded-t focus:outline-none transition-colors text-right" />
                </div>
              </div>
            </section>

            {/* Risk & Screenshot */}
            <div className="grid grid-cols-2 gap-5">
              <section className="bg-surface-container rounded-lg border border-outline-variant p-6">
                <h3 className="text-xl font-semibold text-on-surface mb-5 pb-2 border-b border-outline-variant">Zarządzanie Ryzykiem</h3>
                <div className="flex flex-col gap-5">
                  <div>
                    <label className="block font-mono text-[10px] text-tertiary-container mb-2 uppercase">Stop Loss *</label>
                    <input name="stopLoss" type="number" step="any" required placeholder="0.00000" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)}
                      className="w-full bg-surface-container-highest border-b border-outline-variant focus:border-tertiary-container text-on-surface font-mono py-3 px-3 rounded-t focus:outline-none transition-colors text-right" />
                  </div>
                  <div>
                    <label className="block font-mono text-[10px] text-secondary mb-2 uppercase">Take Profit</label>
                    <input name="takeProfit" type="number" step="any" placeholder="0.00000" value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)}
                      className="w-full bg-surface-container-highest border-b border-outline-variant focus:border-secondary text-on-surface font-mono py-3 px-3 rounded-t focus:outline-none transition-colors text-right" />
                  </div>
                  <div>
                    <label className="block font-mono text-[10px] text-on-surface-variant mb-2 uppercase">Wielkość Pozycji *</label>
                    <input name="positionSize" type="number" step="any" required placeholder="1.00" value={positionSize} onChange={(e) => setPositionSize(e.target.value)}
                      className="w-full bg-surface-container-highest border-b border-outline-variant focus:border-primary text-on-surface font-mono py-3 px-3 rounded-t focus:outline-none transition-colors text-right" />
                  </div>
                  <div>
                    <label className="block font-mono text-[10px] text-on-surface-variant mb-2 uppercase">Prowizje / Swapy (USD)</label>
                    <input name="commissionFees" type="number" step="any" placeholder="0.00" defaultValue="0"
                      className="w-full bg-surface-container-highest border-b border-outline-variant focus:border-primary text-on-surface font-mono py-3 px-3 rounded-t focus:outline-none transition-colors text-right" />
                  </div>
                </div>
              </section>
              <section className="bg-surface-container rounded-lg border border-outline-variant p-6 flex flex-col">
                <h3 className="text-xl font-semibold text-on-surface mb-5 pb-2 border-b border-outline-variant">Zrzut Ekranu</h3>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setDragOver(false); }}
                  className={`flex-1 border-2 border-dashed rounded-lg flex flex-col items-center justify-center p-6 cursor-pointer transition-colors ${dragOver ? "border-primary bg-primary/5" : "border-outline-variant bg-surface-container-highest hover:bg-surface-container-high hover:border-outline"}`}
                >
                  <span className="material-symbols-outlined text-[48px] text-on-surface-variant mb-3">add_photo_alternate</span>
                  <p className="font-mono text-xs text-on-surface text-center mb-1">Przeciągnij i upuść</p>
                  <p className="font-mono text-[10px] text-on-surface-variant text-center">(Wkrótce — Supabase Storage)</p>
                </div>
              </section>
            </div>

            {/* Checklist */}
            <section className="bg-surface-container rounded-lg border border-outline-variant p-6">
              <h3 className="text-xl font-semibold text-on-surface mb-5 pb-2 border-b border-outline-variant">Checklista Przed Transakcją</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: "setup", label: "Setup zgodny z planem?" },
                  { key: "risk", label: "Dzienny limit ryzyka OK?" },
                  { key: "macro", label: "Brak ważnych danych makro?" },
                  { key: "emotion", label: "Stan emocjonalny neutralny?" },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-3 p-3 rounded hover:bg-surface-container-highest cursor-pointer transition-colors border border-transparent hover:border-outline-variant">
                    <input type="checkbox" checked={checklist[key as keyof typeof checklist]} onChange={(e) => setChecklist((p) => ({ ...p, [key]: e.target.checked }))} className="w-4 h-4 rounded accent-[#c0c1ff]" />
                    <span className="text-sm text-on-surface">{label}</span>
                  </label>
                ))}
              </div>
            </section>

            {/* Strategy & Tags */}
            <section className="bg-surface-container rounded-lg border border-outline-variant p-6">
              <h3 className="text-xl font-semibold text-on-surface mb-5 pb-2 border-b border-outline-variant">Strategia i Tagi</h3>
              <div className="grid grid-cols-2 gap-5 mb-5">
                <div>
                  <label className="block font-mono text-[10px] text-on-surface-variant mb-2 uppercase">Strategia</label>
                  <select name="strategyId" className="w-full bg-surface-container-highest border-b border-outline-variant focus:border-primary text-on-surface py-3 px-3 rounded-t focus:outline-none transition-colors">
                    <option value="">Wybierz strategię...</option>
                    {strategies.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-mono text-[10px] text-on-surface-variant mb-2 uppercase">Notatki</label>
                  <textarea name="notes" rows={3} placeholder="Opis setupu, obserwacje..."
                    className="w-full bg-surface-container-highest border border-outline-variant focus:border-primary text-on-surface text-sm py-2 px-3 rounded focus:outline-none transition-colors resize-none" />
                </div>
              </div>

              {/* Tags */}
              {tags.length > 0 ? (
                <div>
                  <p className="font-mono text-[10px] text-on-surface-variant uppercase mb-3">Tagi Psychologiczne</p>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => {
                      const isSelected = selectedTags.includes(tag.id);
                      const colorCls = TAG_CATEGORIES[tag.category] ?? "text-on-surface-variant";
                      return (
                        <button type="button" key={tag.id} onClick={() => toggleTag(tag.id)}
                          className={`px-3 py-1 rounded font-mono text-xs transition-colors border ${isSelected ? `border-primary bg-primary/10 text-primary` : `border-outline-variant bg-surface-container-highest ${colorCls}`}`}>
                          {tag.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="font-mono text-xs text-on-surface-variant">Brak tagów — dodaj je w Ustawieniach po wdrożeniu schematu bazy.</p>
              )}
            </section>

            {/* Submit */}
            <div className="flex justify-end gap-3">
              <a href="/log" className="px-6 py-3 border border-outline-variant text-on-surface rounded-lg hover:bg-surface-container-high transition-colors text-sm">Anuluj</a>
              <button type="submit" disabled={isPending} className="bg-primary text-on-primary px-8 py-3 rounded-lg font-semibold text-sm hover:bg-primary-fixed-dim transition-colors flex items-center gap-2 disabled:opacity-60">
                <span className="material-symbols-outlined text-[18px]">{isPending ? "progress_activity" : "save"}</span>
                {isPending ? "Zapisywanie..." : "Log Trade"}
              </button>
            </div>
          </div>

          {/* Risk Assistant */}
          <div className="col-span-4">
            <div className="sticky top-24 bg-surface-container-low border border-outline-variant rounded-lg p-6">
              <div className="flex items-center gap-3 mb-6 pb-3 border-b border-outline-variant">
                <span className="material-symbols-outlined text-primary">analytics</span>
                <h3 className="text-xl font-semibold text-on-surface">Asystent Ryzyka</h3>
              </div>
              {calc ? (
                <div className="flex flex-col gap-5">
                  {/* Risk */}
                  <div className={`rounded-lg p-4 border ${riskOverLimit ? "border-error/40 bg-error/5" : "border-outline-variant bg-surface-container-highest"}`}>
                    <p className="font-mono text-[10px] text-tertiary-container mb-1 uppercase tracking-widest">Ryzyko</p>
                    <p className="text-3xl font-bold text-on-surface">-${calc.risk.toFixed(2)}</p>
                    <p className={`font-mono text-xs mt-1 font-bold ${riskOverLimit ? "text-error" : "text-on-surface-variant"}`}>
                      {calc.riskPct.toFixed(2)}% kapitału
                      {riskOverLimit && ` — przekracza limit ${riskPerTrade}%!`}
                    </p>
                    <div className="mt-2 h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${riskOverLimit ? "bg-error" : "bg-tertiary-container"}`}
                        style={{ width: `${Math.min(calc.riskPct / riskPerTrade * 100, 100)}%` }}
                      />
                    </div>
                    <p className="font-mono text-[9px] text-on-surface-variant mt-1">Limit: {riskPerTrade}% = ${maxRiskAmount.toFixed(2)}</p>
                  </div>

                  {/* Reward */}
                  <div className="rounded-lg p-4 border border-outline-variant bg-surface-container-highest">
                    <p className="font-mono text-[10px] text-secondary mb-1 uppercase tracking-widest">Potencjalny Zysk</p>
                    <p className="text-3xl font-bold text-on-surface">+${calc.reward.toFixed(2)}</p>
                    <p className="font-mono text-xs text-on-surface-variant mt-1">{calc.rewardPct.toFixed(2)}% kapitału</p>
                  </div>

                  {/* R:R */}
                  <div className="bg-surface-container-highest p-4 rounded border border-outline-variant">
                    <p className="font-mono text-[10px] text-on-surface-variant mb-2 uppercase">R:R Ratio</p>
                    <p className={`text-3xl font-bold ${calc.rr >= 2 ? "text-secondary" : calc.rr >= 1 ? "text-primary" : "text-tertiary-container"}`}>
                      1 : {calc.rr.toFixed(2)}
                    </p>
                  </div>

                  {/* Alert */}
                  <div className={`border-l-4 ${riskOverLimit ? "border-l-error" : getRRAlert(calc.rr).cls} bg-surface-container-high p-4 rounded-r`}>
                    <div className="flex gap-2">
                      <span className={`material-symbols-outlined text-[18px] mt-0.5 ${riskOverLimit ? "text-error" : "text-primary"}`}>
                        {riskOverLimit ? "warning" : "info"}
                      </span>
                      <p className="text-xs text-on-surface-variant">
                        {riskOverLimit
                          ? `Ryzyko ${calc.riskPct.toFixed(2)}% przekracza Twój limit ${riskPerTrade}%. Zmniejsz pozycję.`
                          : getRRAlert(calc.rr).text}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <span className="material-symbols-outlined text-[48px] text-on-surface-variant mb-3">calculate</span>
                  <p className="text-sm text-on-surface-variant">Wprowadź Wejście, SL i TP, aby zobaczyć kalkulację.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
    </>
  );
}

function getRRAlert(rr: number) {
  if (rr >= 2) return { cls: "border-l-secondary", text: "Parametry mieszczą się w profilu ryzyka. Możesz kontynuować." };
  if (rr >= 1) return { cls: "border-l-primary", text: "R:R poniżej optymalnego. Rozważ lepszy punkt wejścia." };
  return { cls: "border-l-tertiary-container", text: "Uwaga: R:R poniżej 1.0. Zagranie nie spełnia minimalnego kryterium." };
}
