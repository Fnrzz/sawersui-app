'use server'

import { createClient, createAdminClient } from "@/lib/supabase/server";

export interface StreamerProfile {
  id: string;
  username: string;
  display_name: string;
  wallet_address: string;
}

export async function getStreamerByUsername(username: string): Promise<StreamerProfile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('profiles')
    .select('id, username, display_name, wallet_address')
    .eq('username', username)
    .single();
  
  return data;
}

export async function getStreamerByAddress(address: string): Promise<StreamerProfile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('profiles')
    .select('id, username, display_name, wallet_address')
    .eq('wallet_address', address)
    .single();
  
  return data;
}

export async function saveDonation({
  streamer_id,
  donor_name,
  message,
  amount_net,
  tx_digest
}: {
  streamer_id: string;
  donor_name: string;
  message: string;
  amount_net: number;
  tx_digest: string;
}) {
  const supabase = await createAdminClient();
  const { error } = await supabase
    .from('donations')
    .insert({
      streamer_id,
      donor_name,
      message,
      amount_net,
      tx_digest,
    });

  if (error) {
    console.error("Error saving donation:", error);
    throw error;
  }

  return { success: true };
}

export async function getDonations(streamerId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('donations')
    .select('*')
    .eq('streamer_id', streamerId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching donations:", error);
    return [];
  }

  return data;
}
