"use client";

import { useEffect, useState, useRef } from "react";
import { useDonationEvents, DonationEvent } from "@/hooks/useDonationEvents";
import { AnimatePresence } from "framer-motion";
import { DonationAlertCard } from "./DonationAlertCard";

interface DonationAlertProps {
  streamerId: string;
}

export function DonationAlert({ streamerId }: DonationAlertProps) {
  const [queue, setQueue] = useState<DonationEvent[]>([]);
  const [currentAlert, setCurrentAlert] = useState<DonationEvent | null>(null);
  const [isShowing, setIsShowing] = useState(false);
  
  // Ref to track processing state without triggering rerenders
  const isProcessing = useRef(false);

  // 1. Add new events to queue via callback
  useDonationEvents(streamerId, (newDonation) => {
      setQueue((prev) => [...prev, newDonation]);
  });

  // 2. Process Queue
  useEffect(() => {
    if (queue.length === 0 || isShowing || isProcessing.current) return;

    const processNext = async () => {
      isProcessing.current = true;
      const nextDonation = queue[0];
      
      // Update Queue immediately
      setQueue((prev) => prev.slice(1));
      
      // Show Alert
      setCurrentAlert(nextDonation);
      setIsShowing(true);
      
      // Play Sound
      try {
        const audio = new Audio("/sound/soundnotif.mp3");
        await audio.play();
      } catch (err) {
        console.error("Audio playback failed:", err);
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
  }, [queue, isShowing]); // Re-run when queue changes or showing state updates

  return (
    <div className="w-full h-screen flex items-center justify-center pb-20 p-4">
      <AnimatePresence>
        {isShowing && currentAlert && (
          <DonationAlertCard data={currentAlert} />
        )}
      </AnimatePresence>
    </div>
  );
}
