import { NextResponse } from "next/server";
import { Transaction } from "@mysten/sui/transactions";
import { getSuiClient } from "@/lib/sui-client";
import { decodeSuiPrivateKey } from "@mysten/sui/cryptography";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { fromBase64 } from "@mysten/sui/utils";
import { CONFIG } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/server";

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

export async function POST(req: Request) {
  try {
    const { milestoneId } = await req.json();

    if (!milestoneId) {
      return NextResponse.json(
        { error: "Missing milestoneId" },
        { status: 400 },
      );
    }

    const supabase = await createAdminClient();
    const { data: milestone, error } = await supabase
      .from("milestones")
      .select("*")
      .eq("id", milestoneId)
      .single();

    if (error || !milestone) {
      return NextResponse.json(
        { error: "Milestone not found" },
        { status: 404 },
      );
    }

    if (milestone.status !== "completed") {
      return NextResponse.json(
        {
          error: `Milestone status is ${milestone.status}, expected 'completed'`,
        },
        { status: 400 },
      );
    }

    if (!milestone.winner_address) {
      return NextResponse.json(
        { error: "No winner address set for milestone" },
        { status: 400 },
      );
    }

    // Initialize Sui Client and Admin Signer
    const client = getSuiClient();
    const adminKeypair = getAdminKeypair();
    const adminAddress = adminKeypair.toSuiAddress();

    const tx = new Transaction();
    tx.setSender(adminAddress);

    // Call mint_to_winner
    // Module assumed to be 'milestone_nft' based on common patterns,
    // but relying on NEXT_PUBLIC_PACKAGE_ID_MINT_NFT
    tx.moveCall({
      target: `${CONFIG.SUI.ADDRESS.MINT_NFT_PACKAGE_ID}::reward_nft::mint_to_winner`,
      arguments: [
        tx.object(CONFIG.SUI.ADDRESS.ADMIN_CAP),
        tx.pure.string(milestone.title),
        tx.pure.string(""), // DB Schema no longer has description
        tx.pure.string(milestone.walrus_url || ""),
        tx.pure.string(milestone.id), // Passing DB ID as string
        tx.pure.address(milestone.winner_address),
      ],
    });

    // Sign and Execute
    const { digest } = await client.signAndExecuteTransaction({
      signer: adminKeypair,
      transaction: tx,
    });

    // Update Supabase
    const { error: updateError } = await supabase
      .from("milestones")
      .update({
        status: "minted",
        tx_digest: digest,
      })
      .eq("id", milestoneId);

    if (updateError) {
      console.error("Failed to update milestone status:", updateError);
      // We don't rollback the blockchain tx, but we should alert
    }

    return NextResponse.json({ success: true, digest });
  } catch (error: unknown) {
    console.error("Error minting milestone NFT:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
