"use client";

import { useEffect } from "react";
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

export function useDonationEvents(streamerId?: string, onNewDonation?: (donation: DonationEvent) => void) {
  useEffect(() => {
    if (!streamerId) return;

    const supabase = createClient();

    const channel = supabase
      .channel('realtime-donations')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'donations',
          filter: `streamer_id=eq.${streamerId}`,
        },
        (payload) => {
          console.log('New Donation Event:', payload);
          if (onNewDonation) {
            onNewDonation(payload.new as DonationEvent);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [streamerId, onNewDonation]); // Added onNewDonation as dependency
}
