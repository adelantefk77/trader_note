import { createClient } from "./server";
import { calcTradeMetrics, calcKPIs, Trade } from "./types";

type EnrichedTrade = Trade & {
  strategy_name: string | null;
  strategy_id: string | null;
  tags: { id: string; name: string; category: string }[];
  rMultiple: number | null;
  pnl: number | null;
};

export async function getTrades(): Promise<EnrichedTrade[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trades")
    .select(`*, strategies ( name ), trade_tags ( tags ( id, name, category ) ), screenshots ( id, storage_path, phase )`)
    .order("entry_time", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((t) => ({
    ...t,
    strategy_name: t.strategies?.name ?? null,
    tags: t.trade_tags?.map((tt: { tags: { id: string; name: string; category: string } }) => tt.tags) ?? [],
    ...calcTradeMetrics(t as Trade),
  }));
}

export async function getTradeById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trades")
    .select(`*, strategies ( name ), trade_tags ( tags ( id, name, category ) ), screenshots ( id, storage_path, phase )`)
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return {
    ...data,
    strategy_name: data.strategies?.name ?? null,
    tags: data.trade_tags?.map((tt: { tags: { id: string; name: string; category: string } }) => tt.tags) ?? [],
    ...calcTradeMetrics(data as Trade),
  };
}

export async function getStrategies() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("strategies").select("*").order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getTags() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("tags").select("*").order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getDashboardData() {
  const trades = await getTrades();
  const kpis = calcKPIs(trades as Trade[]);
  const closedTrades = trades.filter((t) => t.status === "CLOSED");
  const equityPoints = buildEquityCurve(closedTrades);
  return { trades, closedTrades, kpis, equityPoints };
}

function buildEquityCurve(trades: EnrichedTrade[]) {
  const sorted = [...trades]
    .filter((t) => t.pnl !== null && t.exit_time !== null)
    .sort((a, b) => new Date(a.exit_time!).getTime() - new Date(b.exit_time!).getTime());

  let equity = 10000;
  return sorted.map((t) => {
    equity += t.pnl ?? 0;
    return {
      date: new Date(t.exit_time!).toLocaleDateString("pl-PL", { day: "2-digit", month: "short" }),
      equity: Math.round(equity),
    };
  });
}

export async function getAnalyticsData() {
  const trades = await getTrades();
  const strategies = await getStrategies();
  const kpis = calcKPIs(trades as Trade[]);
  const closedTrades = trades.filter((t) => t.status === "CLOSED");

  // Max Drawdown
  const maxDrawdown = calcMaxDrawdown(closedTrades);

  // Per-strategy stats
  const stratStats = strategies.map((s) => {
    const sTrades = closedTrades.filter((t) => t.strategy_id === s.id);
    const winners = sTrades.filter((t) => (t.rMultiple ?? 0) > 0);
    const losers  = sTrades.filter((t) => (t.rMultiple ?? 0) <= 0);
    const totalR  = sTrades.reduce((a, t) => a + (t.rMultiple ?? 0), 0);
    const grossProfit = winners.reduce((a, t) => a + Math.abs(t.pnl ?? 0), 0);
    const grossLoss   = losers.reduce((a, t) => a + Math.abs(t.pnl ?? 0), 0);
    return {
      id: s.id,
      name: s.name,
      winRate: sTrades.length > 0 ? Math.round((winners.length / sTrades.length) * 1000) / 10 : 0,
      profitFactor: grossLoss > 0 ? Math.round((grossProfit / grossLoss) * 100) / 100 : 0,
      avgR: sTrades.length > 0 ? Math.round((totalR / sTrades.length) * 100) / 100 : 0,
      totalR: Math.round(totalR * 100) / 100,
      trades: sTrades.length,
    };
  });

  // Koszt błędów (tagi z ujemnym P&L)
  const tagCosts = computeTagCosts(closedTrades);

  // Wyniki per instrument
  const instrumentStats = computeInstrumentStats(closedTrades);

  // Dane tygodniowe: dyscyplina vs P&L (do wykresu)
  const weeklyData = computeWeeklyData(closedTrades);

  // Time-of-day P&L
  const hourlyData = computeHourlyData(closedTrades);

  return { stratStats, tagCosts, instrumentStats, weeklyData, hourlyData, kpis, maxDrawdown, trades, closedTrades };
}

function calcMaxDrawdown(trades: EnrichedTrade[]) {
  const sorted = [...trades]
    .filter((t) => t.pnl !== null && t.exit_time)
    .sort((a, b) => new Date(a.exit_time!).getTime() - new Date(b.exit_time!).getTime());

  let peak = 0, equity = 0, maxDD = 0;
  for (const t of sorted) {
    equity += t.pnl ?? 0;
    if (equity > peak) peak = equity;
    if (peak > 0) {
      const dd = ((peak - equity) / peak) * 100;
      if (dd > maxDD) maxDD = dd;
    }
  }
  return Math.round(maxDD * 10) / 10;
}

const ERROR_TAGS = ["FOMO", "Revenge Trading", "Oversize", "Hesitation"];

function computeTagCosts(trades: EnrichedTrade[]) {
  const tagMap: Record<string, { cost: number; count: number }> = {};
  for (const t of trades) {
    for (const tag of t.tags ?? []) {
      if (!tagMap[tag.name]) tagMap[tag.name] = { cost: 0, count: 0 };
      tagMap[tag.name].cost += t.pnl ?? 0;
      tagMap[tag.name].count++;
    }
  }
  const negative = Object.entries(tagMap)
    .filter(([, v]) => v.cost < 0)
    .sort((a, b) => a[1].cost - b[1].cost)
    .slice(0, 5);
  const maxAbs = negative.length > 0 ? Math.abs(negative[0][1].cost) : 1;
  return negative.map(([name, { cost, count }]) => ({
    tag: name,
    cost: Math.round(cost * 100) / 100,
    count,
    pct: Math.round((Math.abs(cost) / maxAbs) * 100),
  }));
}

function computeInstrumentStats(trades: EnrichedTrade[]) {
  const map: Record<string, { totalR: number; trades: number }> = {};
  for (const t of trades) {
    const sym = t.instrument;
    if (!map[sym]) map[sym] = { totalR: 0, trades: 0 };
    map[sym].totalR += t.rMultiple ?? 0;
    map[sym].trades++;
  }
  const list = Object.entries(map)
    .map(([instrument, { totalR, trades }]) => ({
      instrument,
      totalR: Math.round(totalR * 100) / 100,
      trades,
    }))
    .sort((a, b) => b.totalR - a.totalR)
    .slice(0, 6);

  const max = Math.max(...list.map((i) => Math.abs(i.totalR)), 1);
  return list.map((i) => ({ ...i, pct: Math.round((Math.abs(i.totalR) / max) * 100) }));
}

function computeWeeklyData(trades: EnrichedTrade[]) {
  const weekMap: Record<string, { pnl: number; total: number; errors: number }> = {};
  for (const t of trades) {
    if (!t.exit_time) continue;
    const d = new Date(t.exit_time);
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    const key = monday.toISOString().split("T")[0];
    if (!weekMap[key]) weekMap[key] = { pnl: 0, total: 0, errors: 0 };
    weekMap[key].pnl += t.pnl ?? 0;
    weekMap[key].total++;
    if ((t.tags ?? []).some((tag) => ERROR_TAGS.includes(tag.name))) weekMap[key].errors++;
  }

  return Object.entries(weekMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8)
    .map(([date, { pnl, total, errors }]) => {
      const adherence = total > 0 ? Math.round(((total - errors) / total) * 100) : 100;
      return {
        period: new Date(date).toLocaleDateString("pl-PL", { day: "2-digit", month: "short" }),
        adherence,
        pnl: Math.round(pnl * 100) / 100,
        color: adherence >= 80 ? "#4edea3" : adherence >= 50 ? "#c0c1ff" : "#ff516a",
      };
    });
}

function computeHourlyData(trades: EnrichedTrade[]) {
  const hours: Record<number, { pnl: number; count: number }> = {};
  for (let h = 0; h < 24; h++) hours[h] = { pnl: 0, count: 0 };
  for (const t of trades) {
    if (!t.entry_time) continue;
    const h = new Date(t.entry_time).getHours();
    hours[h].pnl += t.pnl ?? 0;
    hours[h].count++;
  }
  const maxAbs = Math.max(...Object.values(hours).map((h) => Math.abs(h.pnl)), 1);
  return Object.entries(hours).map(([hour, { pnl, count }]) => ({
    hour: parseInt(hour),
    label: `${hour.toString().padStart(2, "0")}:00`,
    pnl: Math.round(pnl * 100) / 100,
    count,
    intensity: Math.abs(pnl) / maxAbs,
    isPositive: pnl >= 0,
  }));
}
