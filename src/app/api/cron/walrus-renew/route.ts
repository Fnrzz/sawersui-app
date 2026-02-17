export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { WALRUS_AGGREGATOR_URL, WALRUS_PUBLISHER_URL } from "@/lib/walrus";

/**
 * Vercel Cron Job — runs daily at midnight UTC.
 * Renews Walrus blob storage for milestones expiring within 48 hours.
 *
 * Strategy (Content-Addressing HTTP hack):
 *  1. Download the blob bytes from the Aggregator.
 *  2. Re-upload the exact same bytes to the Publisher.
 *  3. Because Walrus is content-addressed, the same Blob ID is reused
 *     but a fresh Storage object with new epochs is created.
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
      .select("id, image_blob_id, walrus_url, expires_at")
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

    // ── 3. Process each milestone: download → re-upload ──
    for (const milestone of milestones) {
      try {
        const blobUrl =
          milestone.walrus_url ||
          `${WALRUS_AGGREGATOR_URL}${milestone.image_blob_id}`;

        // 3a. Download blob bytes from the Aggregator
        const downloadRes = await fetch(blobUrl);
        if (!downloadRes.ok) {
          results.failed++;
          results.errors.push(
            `${milestone.id}: download failed (${downloadRes.status})`,
          );
          continue;
        }

        const body = await downloadRes.arrayBuffer();

        // 3b. Re-upload the exact same bytes to the Publisher (2 epochs)
        const uploadRes = await fetch(`${WALRUS_PUBLISHER_URL}?epochs=2`, {
          method: "PUT",
          headers: { "Content-Type": "application/octet-stream" },
          body,
        });

        if (!uploadRes.ok) {
          const errText = await uploadRes.text();
          results.failed++;
          results.errors.push(
            `${milestone.id}: re-upload failed (${uploadRes.status}): ${errText}`,
          );
          continue;
        }

        console.log(
          `[Cron/WalrusRenew] Re-uploaded ${milestone.id} | blob: ${milestone.image_blob_id}`,
        );

        // ── 4. Update DB — extend expires_at by 2 days ──
        const currentExpiresAt = milestone.expires_at
          ? new Date(milestone.expires_at).getTime()
          : Date.now();
        const newExpiresAt = new Date(
          currentExpiresAt + 2 * 24 * 60 * 60 * 1000,
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
            `${milestone.id}: re-upload OK but DB update failed`,
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
