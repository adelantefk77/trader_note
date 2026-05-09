"use server";

import { createClient } from "../lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function saveProfile(formData: FormData) {
  const supabase = await createClient();

  const accountSize = parseFloat(formData.get("accountSize") as string);
  const currency = formData.get("currency") as string;
  const displayName = formData.get("displayName") as string;
  const timezone = formData.get("timezone") as string;

  const { error } = await supabase.auth.updateUser({
    data: {
      account_size: isNaN(accountSize) ? 10000 : accountSize,
      currency: currency || "USD",
      display_name: displayName || "",
      timezone: timezone || "local",
    },
  });

  if (error) throw new Error(error.message);
  revalidatePath("/settings");
  revalidatePath("/dashboard");
}

export async function saveRiskLimits(formData: FormData) {
  const supabase = await createClient();

  const riskPerTrade = parseFloat(formData.get("riskPerTrade") as string);
  const dailyLossLimit = parseFloat(formData.get("dailyLossLimit") as string);
  const maxPositions = parseInt(formData.get("maxPositions") as string);
  const weeklyTarget = parseFloat(formData.get("weeklyTarget") as string);
  const drawdownAlert = parseFloat(formData.get("drawdownAlert") as string);

  const { error } = await supabase.auth.updateUser({
    data: {
      risk_per_trade: isNaN(riskPerTrade) ? 1.5 : riskPerTrade,
      daily_loss_limit: isNaN(dailyLossLimit) ? 500 : dailyLossLimit,
      max_positions: isNaN(maxPositions) ? 3 : maxPositions,
      weekly_target: isNaN(weeklyTarget) ? 1200 : weeklyTarget,
      drawdown_alert: isNaN(drawdownAlert) ? 5 : drawdownAlert,
    },
  });

  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}

export async function createStrategy(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  if (!name) throw new Error("Nazwa jest wymagana");

  const { error } = await supabase.from("strategies").insert({ user_id: user.id, name, description });
  if (error) throw new Error(error.message);

  revalidatePath("/settings");
  revalidatePath("/new");
  revalidatePath("/analytics");
}

export async function deleteStrategy(strategyId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("strategies").delete().eq("id", strategyId).eq("user_id", user.id);
  if (error) throw new Error(error.message);

  revalidatePath("/settings");
  revalidatePath("/new");
  revalidatePath("/analytics");
}
