export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSponsorKeypair } from "@/lib/sui-sponsor";
import { getSuiClient } from "@/lib/sui-client";
import { createAdminClient } from "@/lib/supabase/server";
import { CONFIG } from "@/lib/config";
import { getWalrusClient } from "@/lib/walrus";

/**
 * Vercel Cron Job — runs daily at midnight UTC.
 * Renews Walrus blob storage for milestones expiring within 48 hours.
 *
 * 2-Coin Architecture:
 *  - SUI  → used implicitly for transaction gas (tx.gas)
 *  - WAL  → explicitly fetched and split, used to pay Walrus storage fees
 */
export async function GET(req: Request) {
  // ── 1. Auth check ──
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = {
    processed: 0,
    success: 0,
    failed: 0,
    errors: [] as string[],
  };

  try {
    // ── 2. Query milestones expiring within 48 hours ──
    const supabase = await createAdminClient();
    const cutoff = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();

    const { data: milestones, error: queryError } = await supabase
      .from("milestones")
      .select("id, image_blob_id, expires_at")
      .not("image_blob_id", "is", null)
      .lt("expires_at", cutoff);

    if (queryError) {
      console.error("[Cron/WalrusRenew] Query error:", queryError);
      return NextResponse.json(
        { error: "Failed to query milestones", details: queryError.message },
        { status: 500 },
      );
    }

    if (!milestones || milestones.length === 0) {
      return NextResponse.json({
        message: "No milestones need renewal",
        ...results,
      });
    }

    results.processed = milestones.length;

    // ── 3. Initialize Sui client and sponsor ──
    const client = getSuiClient();
    const sponsor = getSponsorKeypair();
    const sponsorAddress = sponsor.toSuiAddress();

    // ── 4. Fetch WAL coins from sponsor wallet ──
    // WAL (or FROST on testnet) is the token used to pay Walrus storage fees.
    // SUI is only used for gas. This is the "2-Coin Architecture".
    const walCoinType = CONFIG.WALRUS.WAL_COIN_TYPE;

    if (!walCoinType) {
      return NextResponse.json(
        { error: "WAL_COIN_TYPE env var is not configured" },
        { status: 500 },
      );
    }

    const { data: walCoins } = await client.getCoins({
      owner: sponsorAddress,
      coinType: walCoinType,
    });

    if (!walCoins || walCoins.length === 0) {
      return NextResponse.json(
        {
          error:
            "Insufficient WAL balance — sponsor wallet has no WAL coins for storage fees",
        },
        { status: 400 },
      );
    }

    // ── 5. Process each milestone ──
    // After each on-chain tx the WAL coin's version/digest changes,
    // so we re-fetch WAL coins before each iteration.
    for (const milestone of milestones) {
      try {
        if (!milestone.image_blob_id) {
          results.failed++;
          results.errors.push(`${milestone.id}: missing image_blob_id`);
          continue;
        }

        // Re-fetch WAL coins to get the latest object reference
        const { data: freshWalCoins } = await client.getCoins({
          owner: sponsorAddress,
          coinType: walCoinType,
        });

        if (!freshWalCoins || freshWalCoins.length === 0) {
          results.failed++;
          results.errors.push(`${milestone.id}: WAL balance exhausted`);
          break; // No point continuing if wallet is empty
        }

        // Build PTB — extend storage by 1 epoch using SDK
        const walrusClient = await getWalrusClient();
        const tx = await walrusClient.extendBlobTransaction({
          blobObjectId: milestone.image_blob_id,
          epochs: 1,
        });

        // Set the sender as the sponsor
        tx.setSender(sponsorAddress);

        // Sign and execute — sponsor pays SUI gas from its own balance
        const { digest } = await client.signAndExecuteTransaction({
          signer: sponsor,
          transaction: tx,
        });

        console.log(
          `[Cron/WalrusRenew] Extended ${milestone.id} | blob: ${milestone.image_blob_id} | digest: ${digest}`,
        );

        // ── 6. Update DB — add 24h to the CURRENT expires_at ──
        const currentExpiresAt = milestone.expires_at
          ? new Date(milestone.expires_at).getTime()
          : Date.now();
        const newExpiresAt = new Date(
          currentExpiresAt + 1 * 24 * 60 * 60 * 1000,
        ).toISOString();

        const { error: updateError } = await supabase
          .from("milestones")
          .update({ expires_at: newExpiresAt })
          .eq("id", milestone.id);

        if (updateError) {
          console.error(
            `[Cron/WalrusRenew] DB update failed for ${milestone.id}:`,
            updateError,
          );
          results.failed++;
          results.errors.push(
            `${milestone.id}: on-chain OK but DB update failed`,
          );
        } else {
          results.success++;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(
          `[Cron/WalrusRenew] Failed to renew ${milestone.id}:`,
          message,
        );
        results.failed++;
        results.errors.push(`${milestone.id}: ${message}`);
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("[Cron/WalrusRenew] Unhandled error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message, ...results }, { status: 500 });
  }
}
