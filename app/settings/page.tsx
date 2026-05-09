import AppShell from "../components/AppShell";
import SettingsClient from "./SettingsClient";
import { createClient } from "../lib/supabase/server";
import { getStrategies } from "../lib/supabase/queries";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const strategies = await getStrategies();

  const meta = user?.user_metadata ?? {};

  const userProfile = {
    email: user?.email ?? "",
    displayName: (meta.display_name as string) ?? "",
    accountSize: (meta.account_size as number) ?? 10000,
    currency: (meta.currency as string) ?? "USD",
    timezone: (meta.timezone as string) ?? "local",
    riskPerTrade: (meta.risk_per_trade as number) ?? 1.5,
    dailyLossLimit: (meta.daily_loss_limit as number) ?? 500,
    maxPositions: (meta.max_positions as number) ?? 3,
    weeklyTarget: (meta.weekly_target as number) ?? 1200,
    drawdownAlert: (meta.drawdown_alert as number) ?? 5,
  };

  return (
    <AppShell title="Settings">
      <SettingsClient profile={userProfile} strategies={strategies} />
    </AppShell>
  );
}
