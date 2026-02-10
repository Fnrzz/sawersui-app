"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

export interface DonationEvent {
  id: string;
  streamer_id: string;
  donor_name: string;
  message: string;
  amount_net: number;
  tx_digest: string;
  created_at: string;
  status: string;
}

export function useDonationEvents(
  streamerId?: string,
  onNewDonation?: (donation: DonationEvent) => void,
) {
  // Store callback in a ref so the channel doesn't re-subscribe on every render
  const callbackRef = useRef(onNewDonation);
  callbackRef.current = onNewDonation;

  useEffect(() => {
    if (!streamerId) return;

    const supabase = createClient();

    console.log("[useDonationEvents] Subscribing for streamer:", streamerId);

    const channel = supabase
      .channel(`realtime-donations-${streamerId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "donations",
          filter: `streamer_id=eq.${streamerId}`,
        },
        (payload) => {
          console.log("[useDonationEvents] New Donation Event:", payload);
          callbackRef.current?.(payload.new as DonationEvent);
        },
      )
      .subscribe((status) => {
        console.log("[useDonationEvents] Channel status:", status);
      });

    return () => {
      console.log("[useDonationEvents] Unsubscribing channel");
      supabase.removeChannel(channel);
    };
  }, [streamerId]); // Only re-subscribe when streamerId changes
}
