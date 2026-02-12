"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getSuiClient } from "@/lib/sui-client";
import { CONFIG } from "@/lib/config";

export interface StreamerProfile {
  id: string;
  username: string;
  display_name: string;
  wallet_address: string;
}

export async function getStreamerByUsername(
  username: string,
): Promise<StreamerProfile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, username, display_name, wallet_address")
    .eq("username", username)
    .single();

  return data;
}

export async function getStreamerByAddress(
  address: string,
): Promise<StreamerProfile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, username, display_name, wallet_address")
    .eq("wallet_address", address)
    .single();

  return data;
}

export async function saveDonation({
  streamer_id,
  donor_name,
  message,
  amount_net,
  tx_digest,
}: {
  streamer_id: string;
  donor_name: string;
  message: string;
  amount_net: number;
  tx_digest: string;
}) {
  // 1. Verify Transaction Existence & Status
  const client = getSuiClient();
  let txBlock;

  // Retry mechanism for transaction indexing latency
  let retries = 5;
  while (retries > 0) {
    try {
      txBlock = await client.getTransactionBlock({
        digest: tx_digest,
        options: {
          showEffects: true,
          showBalanceChanges: true,
          showInput: true,
        },
      });
      // If successful, break
      break;
    } catch (error) {
      console.warn(
        `Attempt remaining ${retries}: Transaction ${tx_digest} not found yet...`,
      );
      retries--;
      if (retries === 0) {
        console.error("Failed to fetch transaction after retries:", error);
        throw new Error(
          "Invalid transaction digest or transaction not found (timeout).",
        );
      }
      // Wait 1 second before retrying
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  if (!txBlock) {
    throw new Error("Transaction verification failed (undefined block).");
  }

  if (txBlock.effects?.status.status !== "success") {
    throw new Error("Transaction execution failed on-chain.");
  }

  // 2. Fetch Streamer Wallet
  const supabaseClient = await createClient();
  const { data: streamerProfile } = await supabaseClient
    .from("profiles")
    .select("wallet_address")
    .eq("id", streamer_id)
    .single();

  if (!streamerProfile?.wallet_address) {
    throw new Error("Streamer wallet address not found.");
  }

  // 3. Verify Amount & Recipient from Balance Changes
  const balanceChanges = txBlock.balanceChanges || [];

  let verifiedGrossAmount = 0;

  // Simplify finding the transfer to streamer
  // We look for a balance change where:
  // 1. Owner is the streamer
  // 2. CoinType is USDC
  // 3. Amount is positive (received)

  const usdcChange = balanceChanges.find(
    (c) =>
      c.coinType.includes(CONFIG.SUI.ADDRESS.USDC_TYPE) &&
      BigInt(c.amount) > 0 &&
      (c.owner === streamerProfile.wallet_address ||
        (typeof c.owner === "object" &&
          c.owner !== null &&
          "AddressOwner" in c.owner &&
          (c.owner as { AddressOwner: string }).AddressOwner ===
            streamerProfile.wallet_address)),
  );

  if (!usdcChange) {
    // Fallback: Check if it's a direct transfer in input/events if balanceChanges is ambiguous
    // But strictly, a successful donation MUST result in a balance increase for the streamer.
    throw new Error("No USDC transfer to streamer found in transaction.");
  }

  verifiedGrossAmount = Number(usdcChange.amount) / 1_000_000; // Convert from MIST/Micro to USDC

  // 4. Verify Amount Logic
  // The client sends `amount_net` which should be ~95% of gross.

  // Allow a tiny epsilon for float math if needed, but exact check is better for crypto.
  // We will trust the ON-CHAIN amount as the source of truth.
  // If client sent `amount_net` = 0.95, and chain says 0.95, we are good.

  if (Math.abs(verifiedGrossAmount - amount_net) > 0.01) {
    console.warn(
      `[Security] Amount mismatch. Client claimed: ${amount_net}, Chain delivered: ${verifiedGrossAmount}`,
    );
    // We overwrite with the REAL verified amount to ensure data integrity
    // forcing the record to match reality.
    // throw new Error("Donation amount discrepancy."); // Optional: reject, or just correct it.
    // Correcting it is safer for data integrity.
  }

  const finalAmount = verifiedGrossAmount;

  const supabase = await createAdminClient();
  const { error } = await supabase.from("donations").insert({
    streamer_id,
    donor_name,
    message,
    amount_net: finalAmount, // Use verified amount
    tx_digest,
  });

  if (error) {
    console.error("Error saving donation:", error);
    throw error;
  }

  return { success: true };
}

export async function getDonations(
  streamerId: string,
  page: number = 1,
  limit: number = 6,
) {
  const supabase = await createClient();

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabase
    .from("donations")
    .select("*", { count: "exact" })
    .eq("streamer_id", streamerId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("Error fetching donations:", error);
    return { data: [], total: 0 };
  }

  return { data, total: count || 0 };
}
