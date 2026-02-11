"use client";

import { useEffect, useRef } from "react";
import { getSuiClient } from "@/lib/sui-client";
import { CONFIG } from "@/lib/config";
import type { DonationEvent } from "./useDonationEvents";

interface OnChainDonationPayload {
  donor: string;
  streamer: string;
  amount: string;
  donor_name?: string;
  message?: string;
  ref_id: string;
}

const POLL_INTERVAL = 5000; // 5 seconds

/**
 * Polls on-chain donation events using queryEvents.
 * subscribeEvent was removed in @mysten/sui v2, so we use polling instead.
 */
export function useOnChainDonationEvents(
  streamerAddress: string | undefined,
  onNewDonation?: (donation: DonationEvent) => void,
) {
  const callbackRef = useRef(onNewDonation);
  callbackRef.current = onNewDonation;

  // Track the last seen event cursor to avoid duplicates
  const lastCursorRef = useRef<{ txDigest: string; eventSeq: string } | null>(
    null,
  );

  useEffect(() => {
    const eventType = CONFIG.SUI.ADDRESS.DONATION_EVENT_TYPE;
    if (!streamerAddress || !eventType) return;

    let active = true;
    const client = getSuiClient();

    const poll = async () => {
      try {
        const result = await client.queryEvents({
          query: { MoveEventType: eventType },
          order: "descending",
          limit: 10,
        });

        if (!active || !result.data || result.data.length === 0) return;

        // Process new events (skip already-seen based on cursor)
        for (const event of result.data) {
          const cursor = {
            txDigest: event.id.txDigest,
            eventSeq: event.id.eventSeq,
          };

          // Skip if we've already seen this event
          if (
            lastCursorRef.current &&
            lastCursorRef.current.txDigest === cursor.txDigest &&
            lastCursorRef.current.eventSeq === cursor.eventSeq
          ) {
            break;
          }

          const parsed = event.parsedJson as OnChainDonationPayload;

          // Only process events for this streamer
          if (parsed.streamer !== streamerAddress) continue;

          const donationEvent: DonationEvent = {
            id: event.id.txDigest,
            streamer_id: "",
            donor_name:
              parsed.donor_name || parsed.donor.slice(0, 8) + "...",
            message: parsed.message || "",
            amount_net: Number(parsed.amount) / 1_000_000,
            tx_digest: event.id.txDigest,
            created_at: new Date().toISOString(),
            status: "confirmed",
          };

          console.log(
            "[useOnChainDonationEvents] On-chain event:",
            donationEvent.donor_name,
            donationEvent.amount_net,
          );

          callbackRef.current?.(donationEvent);
        }

        // Update cursor to the latest event
        if (result.data.length > 0) {
          lastCursorRef.current = {
            txDigest: result.data[0].id.txDigest,
            eventSeq: result.data[0].id.eventSeq,
          };
        }
      } catch (err) {
        console.error("[useOnChainDonationEvents] Poll failed:", err);
      }
    };

    // Initial poll to set cursor (don't trigger callbacks on first load)
    const init = async () => {
      try {
        const result = await client.queryEvents({
          query: { MoveEventType: eventType },
          order: "descending",
          limit: 1,
        });
        if (result.data && result.data.length > 0) {
          lastCursorRef.current = {
            txDigest: result.data[0].id.txDigest,
            eventSeq: result.data[0].id.eventSeq,
          };
        }
      } catch {
        // Ignore init errors
      }

      // Start polling for new events
      const interval = setInterval(poll, POLL_INTERVAL);
      return () => clearInterval(interval);
    };

    let cleanup: (() => void) | undefined;
    init().then((c) => {
      cleanup = c;
    });

    console.log(
      "[useOnChainDonationEvents] Polling on-chain events for:",
      streamerAddress,
    );

    return () => {
      active = false;
      cleanup?.();
      console.log("[useOnChainDonationEvents] Stopped polling");
    };
  }, [streamerAddress]);
}
