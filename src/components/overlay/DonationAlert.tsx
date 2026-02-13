"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useDonationEvents, DonationEvent } from "@/hooks/useDonationEvents";
import { AnimatePresence } from "framer-motion";
import { DonationAlertCard } from "./DonationAlertCard";
import { OverlaySettings } from "@/lib/overlay-settings";
import { getLatestMilestoneNft } from "@/lib/nft";

interface DonationAlertProps {
  streamerId: string;
  settings?: OverlaySettings;
}

export function DonationAlert({ streamerId, settings }: DonationAlertProps) {
  const [queue, setQueue] = useState<DonationEvent[]>([]);
  const [currentAlert, setCurrentAlert] = useState<DonationEvent | null>(null);
  const [currentNftImage, setCurrentNftImage] = useState<string | undefined>(
    undefined,
  );
  const [isShowing, setIsShowing] = useState(false);

  // Ref to track processing state without triggering rerenders
  const isProcessing = useRef(false);

  // Stable callback for new donations
  const handleNewDonation = useCallback((newDonation: DonationEvent) => {
    setQueue((prev) => [...prev, newDonation]);
  }, []);

  // 1. Subscribe to realtime donation events
  useDonationEvents(streamerId, handleNewDonation);

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
        isProcessing.current = false;
        return;
      }

      // Fetch NFT if sender_address exists
      let nftUrl: string | undefined;
      if (nextDonation.sender_address) {
        try {
          const nft = await getLatestMilestoneNft(nextDonation.sender_address);
          if (nft) {
            nftUrl = nft.imageUrl;
            // console.log("[DonationAlert] Found Reward NFT:", nftUrl);
          }
        } catch (error) {
          console.error("[DonationAlert] Error fetching NFT:", error);
        }
      }

      // Show Alert
      setCurrentNftImage(nftUrl);
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
          setCurrentNftImage(undefined);
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
          <DonationAlertCard
            data={currentAlert}
            settings={settings}
            nftImage={currentNftImage}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
