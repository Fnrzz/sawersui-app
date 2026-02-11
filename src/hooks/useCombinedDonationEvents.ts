"use client";

import { useRef, useCallback } from "react";
import { useDonationEvents, DonationEvent } from "./useDonationEvents";
import { useOnChainDonationEvents } from "./useOnChainDonationEvents";

export function useCombinedDonationEvents(
  streamerId: string | undefined,
  streamerAddress: string | undefined,
  onNewDonation?: (donation: DonationEvent) => void,
) {
  const seenDigests = useRef(new Set<string>());
  const callbackRef = useRef(onNewDonation);
  callbackRef.current = onNewDonation;

  const deduplicatedCallback = useCallback((donation: DonationEvent) => {
    const key = donation.tx_digest;
    if (seenDigests.current.has(key)) return;
    seenDigests.current.add(key);

    // Prevent unbounded memory growth
    if (seenDigests.current.size > 500) {
      const entries = Array.from(seenDigests.current);
      seenDigests.current = new Set(entries.slice(-250));
    }

    callbackRef.current?.(donation);
  }, []);

  // Supabase channel (reliable, has full data: donor_name, message)
  useDonationEvents(streamerId, deduplicatedCallback);

  // On-chain subscription (trustless, lower latency, partial data)
  useOnChainDonationEvents(streamerAddress, deduplicatedCallback);
}
