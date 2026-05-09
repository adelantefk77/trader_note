import AppShell from "../components/AppShell";
import TradeLogClient from "./TradeLogClient";
import { getTrades } from "../lib/supabase/queries";

export default async function TradeLogPage() {
  const trades = await getTrades();
  return (
    <AppShell title="Trade Log">
      <TradeLogClient initialTrades={trades} />
    </AppShell>
  );
}
