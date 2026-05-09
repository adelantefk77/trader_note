"use server";

import { createClient } from "../lib/supabase/server";
import { redirect } from "next/navigation";

export async function createTrade(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const instrument = formData.get("instrument") as string;
  const direction = formData.get("direction") as "LONG" | "SHORT";
  const entryPrice = parseFloat(formData.get("entryPrice") as string);
  const stopLoss = parseFloat(formData.get("stopLoss") as string);
  const takeProfit = formData.get("takeProfit") ? parseFloat(formData.get("takeProfit") as string) : null;
  const positionSize = parseFloat(formData.get("positionSize") as string);
  const commissionFees = formData.get("commissionFees") ? parseFloat(formData.get("commissionFees") as string) : 0;
  const strategyId = formData.get("strategyId") as string | null;
  const notes = formData.get("notes") as string | null;
  const tagIds = (formData.getAll("tagIds") as string[]).filter(Boolean);
  const entryTime = formData.get("entryTime") as string;

  const { data: trade, error } = await supabase
    .from("trades")
    .insert({
      user_id: user.id,
      instrument,
      direction,
      entry_price: entryPrice,
      stop_loss: stopLoss,
      take_profit: takeProfit,
      position_size: positionSize,
      commission_fees: commissionFees,
      strategy_id: strategyId || null,
      notes: notes || null,
      entry_time: entryTime || new Date().toISOString(),
      status: "OPEN",
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  if (tagIds.length > 0) {
    await supabase.from("trade_tags").insert(
      tagIds.map((tag_id) => ({ trade_id: trade.id, tag_id }))
    );
  }

  redirect(`/log/${trade.id}`);
}

export async function closeTrade(tradeId: string, exitPrice: number, exitTime: string, commissionFees: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("trades")
    .update({ exit_price: exitPrice, exit_time: exitTime, commission_fees: commissionFees, status: "CLOSED" })
    .eq("id", tradeId)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  redirect(`/log/${tradeId}`);
}

export async function deleteTrade(tradeId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("trades")
    .delete()
    .eq("id", tradeId)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  redirect("/log");
}
