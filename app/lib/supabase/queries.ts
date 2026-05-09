import { createClient } from "./server";
import { calcTradeMetrics, calcKPIs, Trade } from "./types";

export async function getTrades() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trades")
    .select(`
      *,
      strategies ( name ),
      trade_tags ( tags ( id, name, category ) ),
      screenshots ( id, storage_path, phase )
    `)
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
    .select(`
      *,
      strategies ( name ),
      trade_tags ( tags ( id, name, category ) ),
      screenshots ( id, storage_path, phase )
    `)
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
  const { data, error } = await supabase
    .from("strategies")
    .select("*")
    .order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getTags() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tags")
    .select("*")
    .order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getDashboardData() {
  const trades = await getTrades();
  const closedTrades = trades.filter((t) => t.status === "CLOSED");
  const kpis = calcKPIs(trades as Trade[]);

  const equityPoints = buildEquityCurve(closedTrades as (Trade & { pnl: number | null })[]);

  return { trades, closedTrades, kpis, equityPoints };
}

function buildEquityCurve(trades: (Trade & { pnl: number | null })[]) {
  const sorted = [...trades]
    .filter((t) => t.pnl !== null && t.exit_time !== null)
    .sort((a, b) => new Date(a.exit_time!).getTime() - new Date(b.exit_time!).getTime());

  let equity = 10000;
  return sorted.map((t) => {
    equity += t.pnl ?? 0;
    const d = new Date(t.exit_time!);
    return {
      date: d.toLocaleDateString("pl-PL", { day: "2-digit", month: "short" }),
      equity: Math.round(equity),
    };
  });
}

export async function getAnalyticsData() {
  const trades = await getTrades();
  const strategies = await getStrategies();

  const stratStats = strategies.map((s) => {
    const sTrades = trades.filter((t) => t.strategy_id === s.id && t.status === "CLOSED");
    const winners = sTrades.filter((t) => (t.rMultiple ?? 0) > 0);
    const losers = sTrades.filter((t) => (t.rMultiple ?? 0) <= 0);
    const totalR = sTrades.reduce((a, t) => a + (t.rMultiple ?? 0), 0);
    const grossProfit = winners.reduce((a, t) => a + Math.abs(t.pnl ?? 0), 0);
    const grossLoss = losers.reduce((a, t) => a + Math.abs(t.pnl ?? 0), 0);

    return {
      id: s.id,
      name: s.name,
      type: "",
      winRate: sTrades.length > 0 ? Math.round((winners.length / sTrades.length) * 1000) / 10 : 0,
      profitFactor: grossLoss > 0 ? Math.round((grossProfit / grossLoss) * 100) / 100 : 0,
      avgR: sTrades.length > 0 ? Math.round((totalR / sTrades.length) * 100) / 100 : 0,
      totalR: Math.round(totalR * 100) / 100,
      trades: sTrades.length,
    };
  });

  const tagCosts = computeTagCosts(trades as (Trade & { tags: { name: string }[]; pnl: number | null })[]);

  return { stratStats, tagCosts, trades };
}

function computeTagCosts(trades: (Trade & { tags: { name: string }[]; pnl: number | null })[]) {
  const tagMap: Record<string, number> = {};
  for (const t of trades) {
    for (const tag of t.tags ?? []) {
      tagMap[tag.name] = (tagMap[tag.name] ?? 0) + (t.pnl ?? 0);
    }
  }
  const negative = Object.entries(tagMap)
    .filter(([, v]) => v < 0)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 5);
  const maxAbs = negative.length > 0 ? Math.abs(negative[0][1]) : 1;
  return negative.map(([name, cost]) => ({
    tag: name,
    cost: Math.round(cost * 100) / 100,
    pct: Math.round((Math.abs(cost) / maxAbs) * 100),
  }));
}
