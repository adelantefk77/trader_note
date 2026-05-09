"use client";

import { useState, useTransition, useCallback } from "react";
import { createTrade } from "./actions";

interface Strategy { id: string; name: string; }
interface Tag { id: string; name: string; category: string; }

// Parsuje symbol na walutę bazową i kwotowaną
function parseSymbol(raw: string) {
  const clean = raw.trim().toUpperCase().replace(/\.P$/i, "");
  const isPerpetual = raw.trim().toUpperCase().endsWith(".P");

  const quotes = ["USDT", "USDC", "BUSD", "FDUSD", "TUSD", "USD", "BTC", "ETH", "BNB"];
  for (const q of quotes) {
    if (clean.endsWith(q) && clean.length > q.length) {
      return { base: clean.slice(0, -q.length), quote: q, isPerpetual };
    }
  }
  // Forex 6-znak: EURUSD, GBPJPY
  if (clean.length === 6 && /^[A-Z]+$/.test(clean)) {
    return { base: clean.slice(0, 3), quote: clean.slice(3), isPerpetual: false };
  }
  return { base: clean, quote: "USDT", isPerpetual };
}

// R:R kalkulator — pozycja w jednostkach bazowych, PnL w walucie kwotowanej
function calcRR(entry: number, sl: number, tp: number, size: number, accountSize: number) {
  if (!entry || !sl || !tp || !size || sl === entry) return null;
  const riskDist = Math.abs(entry - sl);
  const rewardDist = Math.abs(entry - tp);
  if (riskDist === 0) return null;
  const risk = riskDist * size;
  const reward = rewardDist * size;
  const riskPct = accountSize > 0 ? (risk / accountSize) * 100 : 0;
  const rewardPct = accountSize > 0 ? (reward / accountSize) * 100 : 0;
  return { risk, reward, rr: reward / risk, riskPct, rewardPct };
}

function getRRAlert(rr: number) {
  if (rr >= 2) return { cls: "border-l-secondary", text: "Parametry w normie. Możesz kontynuować." };
  if (rr >= 1) return { cls: "border-l-primary", text: "R:R poniżej optymalnego. Rozważ lepszy punkt wejścia." };
  return { cls: "border-l-tertiary-container", text: "R:R poniżej 1.0 — zagranie nie spełnia minimalnego kryterium." };
}

const TAG_CATEGORIES: Record<string, string> = {
  MISTAKE: "text-error", QUALITY: "text-secondary",
  EMOTION: "text-primary", CONDITION: "text-on-surface-variant",
};

export default function NewTradeClient({
  strategies, tags, accountSize = 10000, currency = "USD", riskPerTrade = 1.5,
}: {
  strategies: Strategy[]; tags: Tag[];
  accountSize?: number; currency?: string; riskPerTrade?: number;
}) {
  const [isPending, startTransition] = useTransition();
  const [direction, setDirection] = useState<"LONG" | "SHORT">("LONG");
  const [instrument, setInstrument] = useState("");
  const [entryPrice, setEntryPrice] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [positionSize, setPositionSize] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [checklist, setChecklist] = useState({ setup: false, risk: false, macro: false, emotion: false });

  // Kurs z Bybit
  const [fetchingPrice, setFetchingPrice] = useState(false);
  const [priceData, setPriceData] = useState<{
    price: number; markPrice: number; fundingRate: number; change24h: number;
  } | null>(null);
  const [priceError, setPriceError] = useState<string | null>(null);

  const parsedSymbol = parseSymbol(instrument);
  const hasSymbol = instrument.trim().length >= 3;
  const canFetchPrice = hasSymbol && (parsedSymbol.isPerpetual || parsedSymbol.quote === "USDT" || parsedSymbol.quote === "USDC");

  const fetchPrice = useCallback(async () => {
    if (!hasSymbol) return;
    setFetchingPrice(true);
    setPriceError(null);
    setPriceData(null);

    // Wywołanie bezpośrednio z przeglądarki — Bybit ma otwarte CORS,
    // unikamy blokowania przez Vercel/AWS IP ranges
    const bybitSymbol = instrument.trim().toUpperCase().replace(/\.P$/i, "");
    try {
      const res = await fetch(
        `https://api.bybit.com/v5/market/tickers?category=linear&symbol=${bybitSymbol}`,
        { cache: "no-store" }
      );
      const json = await res.json();
      const ticker = json?.result?.list?.[0];
      if (!ticker) {
        setPriceError(`Nie znaleziono ${bybitSymbol} na Bybit Perpetuals`);
        return;
      }
      const data = {
        price: parseFloat(ticker.lastPrice),
        markPrice: parseFloat(ticker.markPrice),
        fundingRate: parseFloat(ticker.fundingRate),
        change24h: parseFloat(ticker.price24hPcnt) * 100,
      };
      setPriceData(data);
      setEntryPrice(String(data.price));
    } catch {
      setPriceError("Błąd połączenia z Bybit");
    } finally {
      setFetchingPrice(false);
    }
  }, [instrument, hasSymbol]);

  const calc = calcRR(
    parseFloat(entryPrice), parseFloat(stopLoss),
    parseFloat(takeProfit), parseFloat(positionSize), accountSize
  );
  const maxRiskAmount = (accountSize * riskPerTrade) / 100;
  const riskOverLimit = calc && calc.risk > maxRiskAmount;

  const toggleTag = (id: string) =>
    setSelectedTags((p) => p.includes(id) ? p.filter((t) => t !== id) : [...p, id]);

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
          {/* ── LEWA KOLUMNA ─────────────────────────────────────── */}
          <div className="col-span-8 flex flex-col gap-5">

            {/* Dane Rynkowe */}
            <section className="bg-surface-container rounded-lg border border-outline-variant p-6">
              <h3 className="text-xl font-semibold text-on-surface mb-5 pb-2 border-b border-outline-variant">Dane Rynkowe</h3>
              <div className="grid grid-cols-2 gap-5">

                {/* Instrument + przycisk pobierania kursu */}
                <div className="col-span-2">
                  <label className="block font-mono text-[10px] text-on-surface-variant mb-2 uppercase">
                    Instrument *
                    {parsedSymbol.isPerpetual && (
                      <span className="ml-2 text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded">PERPETUAL</span>
                    )}
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        name="instrument"
                        type="text"
                        required
                        value={instrument}
                        onChange={(e) => { setInstrument(e.target.value); setPriceData(null); setPriceError(null); }}
                        placeholder="np. HBARUSDT.P, BTCUSDT.P, EURUSD"
                        className="w-full bg-surface-container-highest border-b border-outline-variant focus:border-primary text-on-surface font-mono py-3 px-3 rounded-t focus:outline-none transition-colors"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={fetchPrice}
                      disabled={!canFetchPrice || fetchingPrice}
                      title="Pobierz aktualny kurs z Bybit"
                      className="flex items-center gap-1.5 px-4 py-3 bg-surface-container-highest border border-outline-variant rounded hover:border-primary hover:text-primary text-on-surface-variant transition-colors disabled:opacity-40 font-mono text-xs whitespace-nowrap"
                    >
                      <span className={`material-symbols-outlined text-[16px] ${fetchingPrice ? "animate-spin" : ""}`}>
                        {fetchingPrice ? "progress_activity" : "download"}
                      </span>
                      Pobierz kurs
                    </button>
                  </div>

                  {/* Ticker info z Bybit */}
                  {priceData && (
                    <div className="mt-2 flex items-center gap-4 px-3 py-2 bg-surface-container-highest rounded border border-outline-variant">
                      <span className="font-mono text-xs text-on-surface-variant">Mark:</span>
                      <span className="font-mono text-sm text-on-surface font-bold">{priceData.markPrice}</span>
                      <span className="font-mono text-xs text-on-surface-variant">Funding:</span>
                      <span className={`font-mono text-xs font-bold ${priceData.fundingRate >= 0 ? "text-secondary" : "text-tertiary-container"}`}>
                        {(priceData.fundingRate * 100).toFixed(4)}%
                      </span>
                      <span className="font-mono text-xs text-on-surface-variant">24h:</span>
                      <span className={`font-mono text-xs font-bold ${priceData.change24h >= 0 ? "text-secondary" : "text-tertiary-container"}`}>
                        {priceData.change24h >= 0 ? "+" : ""}{priceData.change24h.toFixed(2)}%
                      </span>
                    </div>
                  )}
                  {priceError && (
                    <p className="mt-1.5 font-mono text-[10px] text-error">{priceError}</p>
                  )}
                </div>

                {/* Kierunek */}
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

                {/* Data/czas */}
                <div>
                  <label className="block font-mono text-[10px] text-on-surface-variant mb-2 uppercase">Data i Czas Wejścia</label>
                  <input name="entryTime" type="datetime-local" defaultValue={localIso}
                    className="w-full bg-surface-container-highest border-b border-outline-variant focus:border-primary text-on-surface font-mono py-3 px-3 rounded-t focus:outline-none transition-colors" />
                </div>

                {/* Cena wejścia */}
                <div>
                  <label className="block font-mono text-[10px] text-on-surface-variant mb-2 uppercase">
                    Cena Wejścia * {parsedSymbol.quote && <span className="text-on-surface-variant normal-case">({parsedSymbol.quote})</span>}
                  </label>
                  <input name="entryPrice" type="number" step="any" required placeholder="0.00000"
                    value={entryPrice} onChange={(e) => setEntryPrice(e.target.value)}
                    className="w-full bg-surface-container-highest border-b border-outline-variant focus:border-primary text-on-surface font-mono py-3 px-3 rounded-t focus:outline-none transition-colors text-right" />
                </div>
              </div>
            </section>

            {/* Ryzyko + Screenshot */}
            <div className="grid grid-cols-2 gap-5">
              <section className="bg-surface-container rounded-lg border border-outline-variant p-6">
                <h3 className="text-xl font-semibold text-on-surface mb-5 pb-2 border-b border-outline-variant">Zarządzanie Ryzykiem</h3>
                <div className="flex flex-col gap-5">
                  <div>
                    <label className="block font-mono text-[10px] text-tertiary-container mb-2 uppercase">
                      Stop Loss {parsedSymbol.quote && <span className="text-tertiary-container/70 normal-case">({parsedSymbol.quote})</span>}
                    </label>
                    <input name="stopLoss" type="number" step="any" required placeholder="0.00000"
                      value={stopLoss} onChange={(e) => setStopLoss(e.target.value)}
                      className="w-full bg-surface-container-highest border-b border-outline-variant focus:border-tertiary-container text-on-surface font-mono py-3 px-3 rounded-t focus:outline-none transition-colors text-right" />
                  </div>
                  <div>
                    <label className="block font-mono text-[10px] text-secondary mb-2 uppercase">
                      Take Profit {parsedSymbol.quote && <span className="text-secondary/70 normal-case">({parsedSymbol.quote})</span>}
                    </label>
                    <input name="takeProfit" type="number" step="any" placeholder="0.00000"
                      value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)}
                      className="w-full bg-surface-container-highest border-b border-outline-variant focus:border-secondary text-on-surface font-mono py-3 px-3 rounded-t focus:outline-none transition-colors text-right" />
                  </div>
                  <div>
                    <label className="block font-mono text-[10px] text-on-surface-variant mb-2 uppercase">
                      Wielkość Pozycji *
                      {parsedSymbol.base
                        ? <span className="ml-1 text-primary">({parsedSymbol.base})</span>
                        : <span className="text-on-surface-variant"> (jednostki)</span>
                      }
                    </label>
                    <input name="positionSize" type="number" step="any" required placeholder="0.00"
                      value={positionSize} onChange={(e) => setPositionSize(e.target.value)}
                      className="w-full bg-surface-container-highest border-b border-outline-variant focus:border-primary text-on-surface font-mono py-3 px-3 rounded-t focus:outline-none transition-colors text-right" />
                    {parsedSymbol.base && (
                      <p className="font-mono text-[9px] text-on-surface-variant mt-1">
                        Ilość {parsedSymbol.base} — nie lotów.
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block font-mono text-[10px] text-on-surface-variant mb-2 uppercase">
                      Prowizja ({parsedSymbol.quote || "USDT"})
                    </label>
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
                  className={`flex-1 border-2 border-dashed rounded-lg flex flex-col items-center justify-center p-6 cursor-pointer transition-colors ${dragOver ? "border-primary bg-primary/5" : "border-outline-variant bg-surface-container-highest hover:bg-surface-container-high"}`}
                >
                  <span className="material-symbols-outlined text-[48px] text-on-surface-variant mb-3">add_photo_alternate</span>
                  <p className="font-mono text-xs text-on-surface text-center mb-1">Przeciągnij i upuść</p>
                  <p className="font-mono text-[10px] text-on-surface-variant text-center">Screen przed wejściem</p>
                </div>
              </section>
            </div>

            {/* Checklista */}
            <section className="bg-surface-container rounded-lg border border-outline-variant p-6">
              <div className="flex justify-between items-center mb-5 pb-2 border-b border-outline-variant">
                <h3 className="text-xl font-semibold text-on-surface">Checklista Przed Transakcją</h3>
                <span className={`font-mono text-xs ${Object.values(checklist).every(Boolean) ? "text-secondary" : "text-on-surface-variant"}`}>
                  {Object.values(checklist).filter(Boolean).length}/4
                </span>
              </div>
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

            {/* Strategia i Tagi */}
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
              {tags.length > 0 && (
                <div>
                  <p className="font-mono text-[10px] text-on-surface-variant uppercase mb-3">Tagi Psychologiczne</p>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => {
                      const isSelected = selectedTags.includes(tag.id);
                      return (
                        <button type="button" key={tag.id} onClick={() => toggleTag(tag.id)}
                          className={`px-3 py-1 rounded font-mono text-xs transition-colors border ${isSelected ? "border-primary bg-primary/10 text-primary" : `border-outline-variant bg-surface-container-highest ${TAG_CATEGORIES[tag.category] ?? "text-on-surface-variant"}`}`}>
                          {tag.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>

            {/* Przyciski */}
            <div className="flex justify-end gap-3">
              <a href="/log" className="px-6 py-3 border border-outline-variant text-on-surface rounded-lg hover:bg-surface-container-high transition-colors text-sm">Anuluj</a>
              <button type="submit" disabled={isPending}
                className="bg-primary text-on-primary px-8 py-3 rounded-lg font-semibold text-sm hover:bg-primary-fixed-dim transition-colors flex items-center gap-2 disabled:opacity-60">
                <span className="material-symbols-outlined text-[18px]">{isPending ? "progress_activity" : "save"}</span>
                {isPending ? "Zapisywanie..." : "Log Trade"}
              </button>
            </div>
          </div>

          {/* ── ASYSTENT RYZYKA ──────────────────────────────────── */}
          <div className="col-span-4">
            <div className="sticky top-24 bg-surface-container-low border border-outline-variant rounded-lg p-6">
              <div className="flex items-center gap-3 mb-6 pb-3 border-b border-outline-variant">
                <span className="material-symbols-outlined text-primary">analytics</span>
                <div>
                  <h3 className="text-xl font-semibold text-on-surface">Asystent Ryzyka</h3>
                  <p className="font-mono text-[9px] text-on-surface-variant">Kapitał: {accountSize.toLocaleString("pl-PL")} {currency}</p>
                </div>
              </div>

              {calc ? (
                <div className="flex flex-col gap-5">
                  {/* Ryzyko */}
                  <div className={`rounded-lg p-4 border ${riskOverLimit ? "border-error/40 bg-error/5" : "border-outline-variant bg-surface-container-highest"}`}>
                    <p className="font-mono text-[10px] text-tertiary-container mb-1 uppercase tracking-widest">Ryzyko</p>
                    <p className="text-3xl font-bold text-on-surface">
                      -{calc.risk.toFixed(2)} <span className="text-lg text-on-surface-variant">{parsedSymbol.quote}</span>
                    </p>
                    <p className={`font-mono text-xs mt-1 font-bold ${riskOverLimit ? "text-error" : "text-on-surface-variant"}`}>
                      {calc.riskPct.toFixed(2)}% kapitału{riskOverLimit && ` — przekracza limit!`}
                    </p>
                    <div className="mt-2 h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${riskOverLimit ? "bg-error" : "bg-tertiary-container"}`}
                        style={{ width: `${Math.min((calc.riskPct / riskPerTrade) * 100, 100)}%` }} />
                    </div>
                    <p className="font-mono text-[9px] text-on-surface-variant mt-1">
                      Limit: {riskPerTrade}% = {maxRiskAmount.toFixed(2)} {currency}
                    </p>
                  </div>

                  {/* Potencjalny zysk */}
                  <div className="rounded-lg p-4 border border-outline-variant bg-surface-container-highest">
                    <p className="font-mono text-[10px] text-secondary mb-1 uppercase tracking-widest">Potencjalny Zysk</p>
                    <p className="text-3xl font-bold text-on-surface">
                      +{calc.reward.toFixed(2)} <span className="text-lg text-on-surface-variant">{parsedSymbol.quote}</span>
                    </p>
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
                          ? `Ryzyko ${calc.riskPct.toFixed(2)}% przekracza limit ${riskPerTrade}%. Zmniejsz pozycję.`
                          : getRRAlert(calc.rr).text}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                  <span className="material-symbols-outlined text-[48px] text-on-surface-variant">calculate</span>
                  <p className="text-sm text-on-surface-variant">
                    Wpisz instrument, Wejście, SL i TP — kalkulator policzy ryzyko na żywo.
                  </p>
                  {canFetchPrice && (
                    <button type="button" onClick={fetchPrice} disabled={fetchingPrice}
                      className="text-primary font-mono text-xs hover:text-primary-fixed-dim transition-colors flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">download</span>
                      Pobierz aktualny kurs
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
    </>
  );
}
