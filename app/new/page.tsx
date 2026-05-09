import AppShell from "../components/AppShell";
import NewTradeClient from "./NewTradeClient";
import { getStrategies, getTags } from "../lib/supabase/queries";

export default async function NewTradePage() {
  const [strategies, tags] = await Promise.all([getStrategies(), getTags()]);
  return (
    <AppShell title="Nowa Transakcja">
      <NewTradeClient strategies={strategies} tags={tags} />
    </AppShell>
  );
}
