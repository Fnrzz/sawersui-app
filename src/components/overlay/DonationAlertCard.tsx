"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { DonationEvent } from "@/hooks/useDonationEvents";
import { OverlaySettings } from "@/lib/overlay-settings";

interface DonationAlertCardProps {
  data: DonationEvent;
  settings?: OverlaySettings;
  /** Optional URL for the NFT image reward */
  nftImage?: string;
  /** When true, renders a plain div (no animation) for instant color reactivity */
  preview?: boolean;
}

export function DonationAlertCard({
  data,
  settings,
  nftImage,
  preview,
}: DonationAlertCardProps) {
  const t = useTranslations("Overlay");
  const bgColor = settings?.card_bg_color ?? "#5B21B6";
  const senderColor = settings?.sender_color ?? "#FFDF20";
  const amountColor = settings?.amount_color ?? "#A3E635";
  const messageColor = settings?.message_color ?? "#ffffff";
  const [imgError, setImgError] = useState(false);

  const content = (
    <div className="p-8 flex items-center justify-between gap-8 h-full min-h-[200px] max-w-2xl">
      {/* Left Content */}
      <div className="flex-1 flex flex-col gap-2">
        {/* Name */}
        <h2
          className="text-4xl font-bold font-[family-name:var(--font-pixel-body)] tracking-wide drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] break-all leading-tight"
          style={{ color: senderColor }}
        >
          {data.donor_name}
        </h2>

        {/* Message */}
        {data.message && (
          <p
            className="text-2xl leading-relaxed font-[family-name:var(--font-pixel-body)] break-words w-full my-1 font-bold"
            style={{ color: messageColor }}
          >
            {data.message}
          </p>
        )}

        {/* Amount */}
        <p
          className="text-3xl font-bold font-[family-name:var(--font-pixel)] drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] tracking-widest mt-2"
          style={{ color: amountColor }}
        >
          {data.amount_net.toLocaleString()} {data.coin_type}
        </p>
      </div>

      {/* Right Content: Image */}
      {nftImage && !imgError && (
        <div className="w-40 h-40 shrink-0 relative">
          <div className="absolute inset-0 bg-white border-[4px] border-black rounded-full shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={nftImage}
              alt="Reward NFT"
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          </div>
          {/* Decorative Bubble */}
          <div className="absolute -top-4 -right-2 bg-white border-[3px] border-black px-3 py-1 rounded-full shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] animate-bounce font-[family-name:var(--font-pixel)] text-xs font-bold">
            ❤️
          </div>
        </div>
      )}
    </div>
  );

  const sharedClassName =
    "w-full max-w-3xl overflow-hidden border-[4px] border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] rounded-2xl";

  // Preview mode: plain div for instant reactivity (no framer-motion caching)
  if (preview) {
    return (
      <div className={sharedClassName} style={{ backgroundColor: bgColor }}>
        {content}
      </div>
    );
  }

  // Overlay mode: animated entrance
  return (
    <motion.div
      initial={{ y: 50, opacity: 0, scale: 0.9 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: -50, opacity: 0, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={sharedClassName}
      style={{ backgroundColor: bgColor }}
    >
      {content}
    </motion.div>
  );
}
