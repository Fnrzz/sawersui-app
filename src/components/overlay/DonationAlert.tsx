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

// Extend Window interface for webkitAudioContext
declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
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

    // Helper to play base64 PCM audio
    const playAudio = async (base64: string): Promise<void> => {
      // Create context inside the user interaction flow (or here in effect)
      // Note: Browsers usually require user interaction to start AudioContext,
      // but in OBS Browser Source, it's often allowed or "autoplay" is enabled.
      // If it fails, we catch it.
      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioContextClass({ sampleRate: 24000 });

      return new Promise((resolve, reject) => {
        try {
          const binaryString = window.atob(base64);
          const len = binaryString.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          const arrayBuffer = bytes.buffer;
          const dataView = new DataView(arrayBuffer);

          // PCM 16-bit is 2 bytes per sample
          // Gemini returns 16-bit PCM at 24kHz
          const numSamples = arrayBuffer.byteLength / 2;
          const audioBuffer = audioCtx.createBuffer(1, numSamples, 24000);
          const channelData = audioBuffer.getChannelData(0);

          for (let i = 0; i < numSamples; i++) {
            // Convert Int16 to Float32 [-1.0, 1.0]
            const int16 = dataView.getInt16(i * 2, true); // Little endian
            channelData[i] = int16 / 32768.0;
          }

          const source = audioCtx.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(audioCtx.destination);
          source.onended = () => {
            source.disconnect();
            audioCtx.close();
            resolve();
          };
          source.start();
        } catch (e) {
          audioCtx.close();
          reject(e);
        }
      });
    };

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
          }
        } catch (error) {
          console.error("[DonationAlert] Error fetching NFT:", error);
        }
      }

      // --- Alerts & TTS Logic ---
      const isTTSEnabled =
        settings?.is_tts_enabled &&
        nextDonation.amount_net >= (settings?.tts_min_amount || 0);

      let audioBase64: string | null = null;

      // 1. Pre-fetch TTS if enabled
      if (isTTSEnabled) {
        try {
          const text = `${nextDonation.donor_name} berdonasi ${nextDonation.amount_net} koin ${nextDonation.coin_type}. ${nextDonation.message}`;
          const res = await fetch("/api/tts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text,
              voiceType: nextDonation.tts_voice || "female",
            }),
          });
          const data = await res.json();
          if (data.audioBase64) {
            audioBase64 = data.audioBase64;
          }
        } catch (error) {
          console.error("[DonationAlert] TTS Generation Error:", error);
          // Continue without TTS if generation fails
        }
      }

      // 2. Show Alert (Now that audio is ready or failed)
      setCurrentNftImage(nftUrl);
      setCurrentAlert(nextDonation);
      setIsShowing(true);

      // 3. Play Sounds
      try {
        // Play Alert Sound (Ding!)
        const soundSrc = settings?.sound_url || "/sound/soundnotif.mp3";
        await new Promise<void>((resolve) => {
          const audio = new Audio(soundSrc);
          audio.onended = () => resolve();
          audio.onerror = () => resolve(); // Proceed even if error
          audio.play().catch(() => resolve()); // Proceed if autoplay blocked
        });
      } catch {
        // ignore
      }

      // Play TTS if available
      if (audioBase64) {
        try {
          await playAudio(audioBase64);
          // Add a small delay after speech before closing
          await new Promise((r) => setTimeout(r, 1000));
        } catch (e) {
          console.error("[DonationAlert] Audio Playback Error:", e);
          await new Promise((r) => setTimeout(r, 5000)); // Fallback wait
        }
      } else {
        // No TTS or TTS failed: Standard wait
        await new Promise((r) => setTimeout(r, 10000));
      }

      // Close Alert
      setIsShowing(false);

      // Wait for exit animation (500ms) before processing next
      setTimeout(() => {
        setCurrentAlert(null);
        setCurrentNftImage(undefined);
        isProcessing.current = false;
      }, 500);
    };

    processNext();
  }, [
    queue,
    isShowing,
    settings?.sound_url,
    settings?.min_amount,
    settings?.is_tts_enabled,
    settings?.tts_min_amount,
  ]);

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
