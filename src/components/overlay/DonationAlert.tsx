"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { DonationEvent } from "@/hooks/useDonationEvents";
import { useCombinedDonationEvents } from "@/hooks/useCombinedDonationEvents";
import { AnimatePresence } from "framer-motion";
import { DonationAlertCard } from "./DonationAlertCard";
import { OverlaySettings } from "@/lib/overlay-settings";

interface DonationAlertProps {
  streamerId: string;
  streamerAddress?: string;
  settings?: OverlaySettings;
}

export function DonationAlert({ streamerId, streamerAddress, settings }: DonationAlertProps) {
  const [queue, setQueue] = useState<DonationEvent[]>([]);
  const [currentAlert, setCurrentAlert] = useState<DonationEvent | null>(null);
  const [isShowing, setIsShowing] = useState(false);

  // Ref to track processing state without triggering rerenders
  const isProcessing = useRef(false);

  // Stable callback for new donations
  const handleNewDonation = useCallback((newDonation: DonationEvent) => {
    console.log(
      "[DonationAlert] Queuing donation:",
      newDonation.donor_name,
      newDonation.amount_net,
    );
    setQueue((prev) => [...prev, newDonation]);
  }, []);

  // 1. Subscribe to realtime donation events (Supabase + on-chain)
  useCombinedDonationEvents(streamerId, streamerAddress, handleNewDonation);

  // 2. Process Queue
  useEffect(() => {
    if (queue.length === 0 || isShowing || isProcessing.current) return;

    const processNext = async () => {
      isProcessing.current = true;
      const nextDonation = queue[0];

      // Update Queue immediately
      setQueue((prev) => prev.slice(1));

      // Skip donations below min_amount (account for 5% platform fee)
      const minAmount = settings?.min_amount ?? 0;
      const minAmountNet = minAmount * 0.95;
      if (minAmountNet > 0 && nextDonation.amount_net < minAmountNet) {
        console.log(
          "[DonationAlert] Skipping donation below min_amount:",
          nextDonation.amount_net,
          "<",
          minAmountNet,
        );
        isProcessing.current = false;
        return;
      }

      console.log(
        "[DonationAlert] Showing alert for:",
        nextDonation.donor_name,
      );

      // Show Alert
      setCurrentAlert(nextDonation);
      setIsShowing(true);

      // Play Sound — use custom sound if set, else default
      try {
        const soundSrc = settings?.sound_url || "/sound/soundnotif.mp3";
        const audio = new Audio(soundSrc);
        await audio.play();
      } catch (err) {
        console.error("[DonationAlert] Audio playback failed:", err);
      }

      // Display Duration (10 seconds)
      setTimeout(() => {
        setIsShowing(false);

        // Wait for exit animation (500ms) before processing next
        setTimeout(() => {
          setCurrentAlert(null);
          isProcessing.current = false;
        }, 500);
      }, 10000);
    };

    processNext();
  }, [queue, isShowing, settings?.sound_url, settings?.min_amount]);

  return (
    <div className="w-full h-screen flex items-center justify-center pb-20 p-4">
      <AnimatePresence>
        {isShowing && currentAlert && (
          <DonationAlertCard data={currentAlert} settings={settings} />
        )}
      </AnimatePresence>
    </div>
  );
}
