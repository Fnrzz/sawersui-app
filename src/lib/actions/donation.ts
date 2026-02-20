"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getSuiClient } from "@/lib/sui-client";
import { CONFIG } from "@/lib/config";
import { Transaction } from "@mysten/sui/transactions";
import { decodeSuiPrivateKey } from "@mysten/sui/cryptography";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { fromBase64 } from "@mysten/sui/utils";

const SPONSOR_SECRET_KEY = process.env.SPONSOR_SECRET_KEY || "";

function getAdminKeypair(): Ed25519Keypair {
  if (!SPONSOR_SECRET_KEY) {
    throw new Error("SPONSOR_SECRET_KEY is not set in environment variables");
  }

  if (SPONSOR_SECRET_KEY.startsWith("suiprivkey")) {
    const { secretKey } = decodeSuiPrivateKey(SPONSOR_SECRET_KEY);
    return Ed25519Keypair.fromSecretKey(secretKey);
  }

  const rawBytes = fromBase64(SPONSOR_SECRET_KEY);
  if (rawBytes.length === 32) {
    return Ed25519Keypair.fromSecretKey(rawBytes);
  }

  throw new Error("Invalid key length. Expected 32 bytes.");
}

type TransactionBlockResponse = Awaited<
  ReturnType<ReturnType<typeof getSuiClient>["getTransactionBlock"]>
>;

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

// --- Helper Functions ---

async function verifyTransaction(
  txDigest: string,
): Promise<TransactionBlockResponse> {
  const client = getSuiClient();
  let txBlock: TransactionBlockResponse | undefined;
  let retries = 5;

  while (retries > 0) {
    try {
      txBlock = await client.getTransactionBlock({
        digest: txDigest,
        options: {
          showEffects: true,
          showBalanceChanges: true,
          showInput: true,
        },
      });
      return txBlock;
    } catch (error) {
      console.warn(
        `Attempt remaining ${retries}: Transaction ${txDigest} not found yet...`,
      );
      retries--;
      if (retries === 0) {
        throw new Error(
          `Transaction verified failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  throw new Error("Transaction verification timeout.");
}

function verifyDonationAmount(
  txBlock: TransactionBlockResponse,
  streamerAddress: string,
): { amount: number; coinType: string } {
  if (txBlock.effects?.status.status !== "success") {
    throw new Error("Transaction execution failed on-chain.");
  }

  const balanceChanges = txBlock.balanceChanges || [];

  // Check for USDC (6 decimals)
  const usdcChange = balanceChanges.find(
    (c) =>
      c.coinType.includes(CONFIG.SUI.ADDRESS.USDC_TYPE) &&
      BigInt(c.amount) > 0 &&
      (c.owner === streamerAddress ||
        (typeof c.owner === "object" &&
          c.owner !== null &&
          "AddressOwner" in c.owner &&
          (c.owner as { AddressOwner: string }).AddressOwner ===
            streamerAddress)),
  );

  if (usdcChange) {
    return {
      amount: Number(usdcChange.amount) / 1_000_000,
      coinType: "USDC",
    };
  }

  // Check for SUI (9 decimals)
  const suiChange = balanceChanges.find(
    (c) =>
      c.coinType.includes("0x2::sui::SUI") &&
      BigInt(c.amount) > 0 &&
      (c.owner === streamerAddress ||
        (typeof c.owner === "object" &&
          c.owner !== null &&
          "AddressOwner" in c.owner &&
          (c.owner as { AddressOwner: string }).AddressOwner ===
            streamerAddress)),
  );

  if (suiChange) {
    return {
      amount: Number(suiChange.amount) / 1_000_000_000,
      coinType: "SUI",
    };
  }

  throw new Error("No USDC or SUI transfer to streamer found in transaction.");
}

// --- Main Action ---

export async function saveDonation({
  streamer_id,
  donor_name,
  message,
  amount_net,
  tx_digest,
  tts_voice,
}: {
  streamer_id: string;
  donor_name: string;
  message: string;
  amount_net: number;
  tx_digest: string;
  tts_voice?: string;
}) {
  // 1. Verify Info
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("wallet_address")
    .eq("id", streamer_id)
    .single();

  if (!profile?.wallet_address) {
    throw new Error("Streamer profile not found");
  }

  // 2. Verify Transaction & Amount
  const txBlock = await verifyTransaction(tx_digest);
  const { amount: verifiedAmount, coinType } = verifyDonationAmount(
    txBlock,
    profile.wallet_address,
  );

  // 3. Optional: Check amount match
  if (Math.abs(verifiedAmount - amount_net) > 0.05) {
    console.warn(
      `[Donation] Amount mismatch: Claimed ${amount_net}, Verified ${verifiedAmount}`,
    );
  }

  // 4. Fetch Active Milestone (Optimization: Do this before insert to link immediately)
  const adminSupabase = await createAdminClient();
  let milestoneId: string | undefined;

  {
    // debug query: fetch active milestone matching coin_type
    const { data: milestone, error: milestoneError } = await adminSupabase
      .from("milestones")
      .select("id, status, title")
      .eq("streamer_id", streamer_id)
      .eq("status", "active")
      .eq("coin_type", coinType) // Match short coin type: "USDC" or "SUI"
      .limit(1)
      .maybeSingle();

    if (milestoneError) {
      console.error(
        "[Donation] Error fetching active milestone:",
        milestoneError,
      );
    }

    milestoneId = milestone?.id;
  }

  // 5. Extract Sender Address
  // Cast data to any or specific shape to avoid TS union issues if sender is not on all variants
  const senderAddress = (txBlock.transaction?.data as { sender?: string })
    ?.sender;

  // 6. Save Donation
  const insertPayload = {
    streamer_id,
    donor_name,
    message,
    amount_net: verifiedAmount,
    tx_digest,
    sender_address: senderAddress, // Save immediately
    milestone_id: milestoneId, // Save immediately
    coin_type: coinType, // Save Coin Type
    tts_voice: tts_voice || "female", // Default to female
  };

  const { error: insertError } = await adminSupabase
    .from("donations")
    .insert(insertPayload);

  if (insertError) {
    console.error("[Donation] Insert failed:", insertError);
    throw insertError;
  }

  // 7. Update Milestone & Pick Winner
  // We pass milestoneId to avoid re-fetching if possible, though logic below might re-check for safety
  if (milestoneId) {
    await updateMilestoneProgress(milestoneId, verifiedAmount);
  }

  return { success: true };
}

async function updateMilestoneProgress(milestoneId: string, amount: number) {
  const supabase = await createAdminClient();

  try {
    // A. Fetch Milestone by ID (Direct lookup is faster and safer since we know the ID)
    const { data: milestone, error: fetchError } = await supabase
      .from("milestones")
      .select("*")
      .eq("id", milestoneId)
      .single();

    if (fetchError || !milestone) {
      console.error(
        "[Milestone] Error fetching milestone or not found:",
        fetchError,
      );
      return;
    }

    // Double check status just in case (optional, but good for concurrency)
    if (milestone.status !== "active") {
      return;
    }

    // B. Update Progress
    const currentAmount = Number(milestone.current_amount) || 0;
    const newAmount = currentAmount + amount;
    const isCompleted = newAmount >= Number(milestone.target_amount);

    const updateData: {
      current_amount: number;
      status?: string;
      winner_address?: string;
    } = {
      current_amount: newAmount,
    };

    if (isCompleted) {
      updateData.status = "completed";

      // C. Pick Winner (if completed)
      const { data: donors } = await supabase
        .from("donations")
        .select("sender_address")
        .eq("milestone_id", milestone.id)
        .not("sender_address", "is", null);

      if (donors && donors.length > 0) {
        // Simple random picker
        const uniqueDonors = Array.from(
          new Set(
            donors.map(
              (d: { sender_address: string | null }) => d.sender_address,
            ),
          ),
        ).filter((addr): addr is string => addr !== null);

        const winnerIndex = Math.floor(Math.random() * uniqueDonors.length);
        const winner = uniqueDonors[winnerIndex];
        // Ensure winner is a string
        if (winner) {
          updateData.winner_address = winner;
        }
      }
    }

    const { error: updateError } = await supabase
      .from("milestones")
      .update(updateData)
      .eq("id", milestone.id);

    if (updateError) {
      console.error("[Milestone] Update failed:", updateError);
    } else {
      // D. Mint NFT if completed and winner picked
      if (
        isCompleted &&
        updateData.winner_address &&
        updateData.status === "completed"
      ) {
        await mintToWinner(
          milestone.id,
          milestone.title,
          milestone.image_url || "",
          updateData.winner_address,
        );
      }
    }
  } catch (error) {
    console.error("[Milestone] Unexpected error:", error);
  }
}

async function mintToWinner(
  milestoneId: string,
  title: string,
  imageUrl: string,
  winnerAddress: string,
) {
  try {
    const client = getSuiClient();
    const adminKeypair = getAdminKeypair();
    const adminAddress = adminKeypair.toSuiAddress();

    const tx = new Transaction();
    tx.setSender(adminAddress);

    tx.moveCall({
      target: `${CONFIG.SUI.ADDRESS.MINT_NFT_PACKAGE_ID}::reward_nft::mint_to_winner`,
      arguments: [
        tx.object(CONFIG.SUI.ADDRESS.ADMIN_CAP),
        tx.pure.string(title),
        tx.pure.string(""), // DB Schema no longer has description
        tx.pure.string(imageUrl),
        tx.pure.string(milestoneId), // Passing DB ID as string
        tx.pure.address(winnerAddress),
      ],
    });

    const { digest } = await client.signAndExecuteTransaction({
      signer: adminKeypair,
      transaction: tx,
    });

    console.log(`[Milestone] Mint successful. Digest: ${digest}`);

    // Update status to minted
    const supabase = await createAdminClient();
    await supabase
      .from("milestones")
      .update({
        status: "minted",
        tx_digest: digest,
      })
      .eq("id", milestoneId);
  } catch (error) {
    console.error(`[Milestone] Mint failed for ${milestoneId}:`, error);
    // Suppress error so it doesn't fail the donation process, likely recoverable
  }
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
