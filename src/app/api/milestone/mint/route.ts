import { NextResponse } from "next/server";
import { Transaction } from "@mysten/sui/transactions";
import { getSuiClient } from "@/lib/sui-client";
import { getSponsorKeypair } from "@/lib/sui-sponsor";
import { CONFIG } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/server";

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

    // Initialize Sui Client and Sponsor Signer
    const client = getSuiClient();
    const sponsorKeypair = getSponsorKeypair();
    const sponsorAddress = sponsorKeypair.toSuiAddress();

    const tx = new Transaction();
    tx.setSender(sponsorAddress);

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
      signer: sponsorKeypair,
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
