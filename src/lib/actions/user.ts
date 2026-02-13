"use server";

import { createClient } from "@/lib/supabase/server";

export async function getUserIdByUsername(
  username: string,
): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .single();
  return data?.id || null;
}

export async function getUserIdByAddress(
  address: string,
): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("wallet_address", address)
    .single();
  return data?.id || null;
}

export async function getUserId(identifier: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .or(`username.eq.${identifier},wallet_address.eq.${identifier}`)
    .single();
  return data?.id || null;
}
