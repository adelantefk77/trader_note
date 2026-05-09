import { NextRequest, NextResponse } from "next/server";

// Normalize symbol: HBARUSDT.P → HBARUSDT (Bybit nie używa .P)
function toBybitSymbol(raw: string) {
  return raw.trim().toUpperCase().replace(/\.P$/i, "");
}

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol");
  if (!symbol) return NextResponse.json({ error: "Brak symbolu" }, { status: 400 });

  const bybitSymbol = toBybitSymbol(symbol);

  try {
    const res = await fetch(
      `https://api.bybit.com/v5/market/tickers?category=linear&symbol=${bybitSymbol}`,
      { cache: "no-store" }
    );
    const json = await res.json();
    const ticker = json?.result?.list?.[0];

    if (!ticker) {
      return NextResponse.json({ error: `Nie znaleziono ${bybitSymbol} na Bybit` }, { status: 404 });
    }

    return NextResponse.json({
      symbol: bybitSymbol,
      price: parseFloat(ticker.lastPrice),
      markPrice: parseFloat(ticker.markPrice),
      indexPrice: parseFloat(ticker.indexPrice),
      fundingRate: parseFloat(ticker.fundingRate),
      change24h: parseFloat(ticker.price24hPcnt) * 100,
    });
  } catch {
    return NextResponse.json({ error: "Błąd połączenia z Bybit" }, { status: 500 });
  }
}
