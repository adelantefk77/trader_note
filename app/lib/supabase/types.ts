export type Direction = "LONG" | "SHORT";
export type TradeStatus = "OPEN" | "CLOSED";
export type TagCategory = "MISTAKE" | "CONDITION" | "EMOTION" | "QUALITY";
export type ScreenshotPhase = "BEFORE_ENTRY" | "AFTER_EXIT";

export interface Strategy {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Trade {
  id: string;
  user_id: string;
  strategy_id: string | null;
  instrument: string;
  direction: Direction;
  entry_time: string;
  exit_time: string | null;
  entry_price: number;
  exit_price: number | null;
  stop_loss: number;
  take_profit: number | null;
  position_size: number;
  commission_fees: number;
  notes: string | null;
  status: TradeStatus;
  created_at: string;
  strategies?: { name: string } | null;
  trade_tags?: { tags: Tag }[];
  screenshots?: Screenshot[];
}

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  category: TagCategory;
}

export interface TradeTag {
  trade_id: string;
  tag_id: string;
}

export interface Screenshot {
  id: string;
  trade_id: string;
  user_id: string;
  storage_path: string;
  phase: ScreenshotPhase;
  created_at: string;
}

export interface TradeWithRelations extends Trade {
  strategy_name?: string | null;
  tags?: Tag[];
  r_multiple?: number | null;
  pnl?: number | null;
}

// Wielkość pozycji = ilość jednostek bazowych (np. HBAR w HBARUSDT).
// PnL = różnica_ceny * ilość_jednostek — prowizja (wynik w walucie kwotowanej, np. USDT).
export function calcTradeMetrics(trade: Trade): { rMultiple: number | null; pnl: number | null } {
  if (!trade.exit_price || !trade.exit_time) return { rMultiple: null, pnl: null };

  const riskDistance = Math.abs(trade.entry_price - trade.stop_loss);
  const priceDiff =
    trade.direction === "LONG"
      ? trade.exit_price - trade.entry_price
      : trade.entry_price - trade.exit_price;

  const grossPnl = priceDiff * trade.position_size;
  const pnl = grossPnl - trade.commission_fees;

  const riskAmount = riskDistance * trade.position_size;
  const rMultiple = riskAmount > 0 ? pnl / riskAmount : null;

  return {
    rMultiple: rMultiple !== null ? Math.round(rMultiple * 100) / 100 : null,
    pnl: Math.round(pnl * 100) / 100,
  };
}

export function calcKPIs(trades: Trade[]) {
  const closed = trades.filter((t) => t.status === "CLOSED" && t.exit_price !== null);

  const withMetrics = closed.map((t) => ({ ...t, ...calcTradeMetrics(t) }));
  const winners = withMetrics.filter((t) => (t.rMultiple ?? 0) > 0);
  const losers = withMetrics.filter((t) => (t.rMultiple ?? 0) <= 0);

  const winRate = closed.length > 0 ? (winners.length / closed.length) * 100 : 0;
  const avgWin = winners.length > 0 ? winners.reduce((a, t) => a + (t.rMultiple ?? 0), 0) / winners.length : 0;
  const avgLoss = losers.length > 0 ? Math.abs(losers.reduce((a, t) => a + (t.rMultiple ?? 0), 0) / losers.length) : 0;

  const expectancy = (winRate / 100) * avgWin - (1 - winRate / 100) * avgLoss;

  const grossProfit = winners.reduce((a, t) => a + (t.pnl ?? 0), 0);
  const grossLoss = Math.abs(losers.reduce((a, t) => a + (t.pnl ?? 0), 0));
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0;

  return {
    totalTrades: closed.length,
    winRate: Math.round(winRate * 10) / 10,
    expectancy: Math.round(expectancy * 100) / 100,
    profitFactor: Math.round(profitFactor * 100) / 100,
  };
}
