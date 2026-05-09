export type Direction = "LONG" | "SHORT";
export type TradeStatus = "OPEN" | "CLOSED";

export interface Trade {
  id: string;
  instrument: string;
  direction: Direction;
  entryTime: string;
  exitTime: string | null;
  entryPrice: number;
  exitPrice: number | null;
  stopLoss: number;
  takeProfit: number;
  positionSize: number;
  commissionFees: number;
  notes: string;
  strategy: string;
  tags: string[];
  status: TradeStatus;
  rMultiple: number | null;
  pnl: number | null;
  screenshots: { phase: "BEFORE_ENTRY" | "AFTER_EXIT"; url: string }[];
}

export const TRADES: Trade[] = [
  {
    id: "T-8492",
    instrument: "EUR/USD",
    direction: "LONG",
    entryTime: "2024-03-14T09:30:00Z",
    exitTime: "2024-03-14T14:15:00Z",
    entryPrice: 1.0645,
    exitPrice: 1.0682,
    stopLoss: 1.063,
    takeProfit: 1.07,
    positionSize: 5,
    commissionFees: 35,
    notes: "Wejście zgodnie z planem po wybiciu strefy konsolidacji azjatyckiej. Reakcja na strefę popytu H1 była silna. Pozycja prowadzona na BE po osiągnięciu 1R. Zamknięcie przy 2.4R ze względu na zbliżające się dane makro (CPI).",
    strategy: "London Breakout",
    tags: ["A-Setup", "Cierpliwość", "Skupienie"],
    status: "CLOSED",
    rMultiple: 2.4,
    pnl: 1240.5,
    screenshots: [
      { phase: "BEFORE_ENTRY", url: "/api/placeholder/800/450" },
      { phase: "AFTER_EXIT", url: "/api/placeholder/800/450" },
    ],
  },
  {
    id: "T-8491",
    instrument: "NQ1!",
    direction: "LONG",
    entryTime: "2024-03-13T14:30:00Z",
    exitTime: "2024-03-13T15:45:00Z",
    entryPrice: 18420.5,
    exitPrice: 18465.25,
    stopLoss: 18402,
    takeProfit: 18510,
    positionSize: 2,
    commissionFees: 8.5,
    notes: "ORB Breakout po otwarciu NYSE. Dobry wolumen, wyraźne przebicie.",
    strategy: "ORB Breakout",
    tags: ["A-Setup"],
    status: "CLOSED",
    rMultiple: 2.5,
    pnl: 1250,
    screenshots: [],
  },
  {
    id: "T-8490",
    instrument: "ES1!",
    direction: "SHORT",
    entryTime: "2024-03-13T09:15:00Z",
    exitTime: "2024-03-13T10:00:00Z",
    entryPrice: 5210.25,
    exitPrice: 5216.5,
    stopLoss: 5204,
    takeProfit: 5190,
    positionSize: 1,
    commissionFees: 4.2,
    notes: "FOMO – wszedłem zbyt wcześnie bez potwierdzenia na M5.",
    strategy: "VWAP Fade",
    tags: ["FOMO", "Zły Timing"],
    status: "CLOSED",
    rMultiple: -1.0,
    pnl: -500,
    screenshots: [],
  },
  {
    id: "T-8489",
    instrument: "EUR/USD",
    direction: "LONG",
    entryTime: "2024-03-12T15:45:00Z",
    exitTime: "2024-03-12T17:30:00Z",
    entryPrice: 1.0585,
    exitPrice: 1.0612,
    stopLoss: 1.057,
    takeProfit: 1.0625,
    positionSize: 3,
    commissionFees: 21,
    notes: "Trend Continuation po korekcie na H4. Zgodnie z planem.",
    strategy: "Trend Continuation",
    tags: ["Zgodnie z Planem"],
    status: "CLOSED",
    rMultiple: 1.8,
    pnl: 270,
    screenshots: [],
  },
  {
    id: "T-8488",
    instrument: "GC1!",
    direction: "LONG",
    entryTime: "2024-03-11T10:00:00Z",
    exitTime: "2024-03-11T12:30:00Z",
    entryPrice: 2180.5,
    exitPrice: 2189.2,
    stopLoss: 2173,
    takeProfit: 2198,
    positionSize: 1,
    commissionFees: 6,
    notes: "Złoto – odbicie od wsparcia tygodniowego. Wyjście przed TP.",
    strategy: "VWAP Bounce",
    tags: ["Zbyt wczesne wyjście"],
    status: "CLOSED",
    rMultiple: 1.2,
    pnl: 600,
    screenshots: [],
  },
  {
    id: "T-8487",
    instrument: "BTC/USDT",
    direction: "LONG",
    entryTime: "2024-03-10T08:00:00Z",
    exitTime: "2024-03-10T14:00:00Z",
    entryPrice: 68500,
    exitPrice: 67800,
    stopLoss: 68000,
    takeProfit: 71000,
    positionSize: 0.1,
    commissionFees: 15,
    notes: "Revenge Trading po poprzedniej stracie. Wszedłem bez setupu.",
    strategy: "Brak",
    tags: ["Revenge Trading", "FOMO"],
    status: "CLOSED",
    rMultiple: -1.4,
    pnl: -700,
    screenshots: [],
  },
];

export const EQUITY_DATA = [
  { date: "Sty 01", equity: 10000 },
  { date: "Sty 08", equity: 10250 },
  { date: "Sty 15", equity: 10180 },
  { date: "Sty 22", equity: 10620 },
  { date: "Sty 29", equity: 10890 },
  { date: "Lut 05", equity: 10750 },
  { date: "Lut 12", equity: 11200 },
  { date: "Lut 19", equity: 11050 },
  { date: "Lut 26", equity: 11480 },
  { date: "Mar 04", equity: 11320 },
  { date: "Mar 11", equity: 11890 },
  { date: "Mar 18", equity: 12100 },
  { date: "Mar 25", equity: 12380 },
  { date: "Kwi 01", equity: 12650 },
];

export const CALENDAR_DATA: Record<string, { adherence: number; pnl: number }> = {
  "2024-03-04": { adherence: 100, pnl: 420 },
  "2024-03-05": { adherence: 80, pnl: 150 },
  "2024-03-06": { adherence: 40, pnl: -200 },
  "2024-03-07": { adherence: 100, pnl: 380 },
  "2024-03-08": { adherence: 100, pnl: 290 },
  "2024-03-11": { adherence: 100, pnl: 600 },
  "2024-03-12": { adherence: 0, pnl: 0 },
  "2024-03-13": { adherence: 90, pnl: 270 },
  "2024-03-14": { adherence: 100, pnl: 1240 },
  "2024-03-15": { adherence: 60, pnl: -350 },
};

export const STRATEGIES = [
  {
    id: "1",
    name: "VWAP Bounce",
    type: "Trend Following",
    winRate: 68.2,
    profitFactor: 2.41,
    avgR: 1.8,
    totalR: 12.4,
    trades: 42,
  },
  {
    id: "2",
    name: "ORB Breakout",
    type: "Momentum",
    winRate: 54.5,
    profitFactor: 1.95,
    avgR: 2.1,
    totalR: 8.2,
    trades: 28,
  },
  {
    id: "3",
    name: "London Breakout",
    type: "Session Based",
    winRate: 62.0,
    profitFactor: 2.12,
    avgR: 1.6,
    totalR: 9.8,
    trades: 35,
  },
  {
    id: "4",
    name: "VWAP Fade",
    type: "Mean Reversion",
    winRate: 45.0,
    profitFactor: 1.12,
    avgR: 0.9,
    totalR: 2.1,
    trades: 18,
  },
];

export const KPI = {
  expectancy: 1.84,
  expectancyDelta: 0.12,
  profitFactor: 2.15,
  profitFactorDelta: 0.05,
  maxDrawdown: -8.4,
  maxDrawdownDate: "12 Mar 2024",
  adherenceRate: 92,
  adherenceCount: 50,
  winRate: 61.5,
  totalTrades: 142,
  sharpeRatio: 1.72,
};

export const MISTAKE_COSTS = [
  { tag: "FOMO", cost: -4.5, pct: 75 },
  { tag: "Revenge Trading", cost: -3.2, pct: 55 },
  { tag: "Brak Stop Loss", cost: -2.1, pct: 35 },
  { tag: "Oversize", cost: -1.4, pct: 22 },
  { tag: "Hesitation", cost: -0.8, pct: 13 },
];
