import AppShell from "../components/AppShell";
import NewTradeClient from "./NewTradeClient";
import { getStrategies, getTags } from "../lib/supabase/queries";
import { createClient } from "../lib/supabase/server";

export default async function NewTradePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const meta = user?.user_metadata ?? {};

  const [strategies, tags] = await Promise.all([getStrategies(), getTags()]);

  return (
    <AppShell title="Nowa Transakcja">
      <NewTradeClient
        strategies={strategies}
        tags={tags}
        accountSize={(meta.account_size as number) ?? 10000}
        currency={(meta.currency as string) ?? "USD"}
        riskPerTrade={(meta.risk_per_trade as number) ?? 1.5}
      />
    </AppShell>
  );
}
