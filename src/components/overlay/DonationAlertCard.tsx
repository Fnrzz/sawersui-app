"use client";

import { motion } from "framer-motion";
import { DonationEvent } from "@/hooks/useDonationEvents";
import { OverlaySettings } from "@/lib/overlay-settings";

interface DonationAlertCardProps {
  data: DonationEvent;
  settings?: OverlaySettings;
  /** When true, renders a plain div (no animation) for instant color reactivity */
  preview?: boolean;
}

export function DonationAlertCard({
  data,
  settings,
  preview,
}: DonationAlertCardProps) {
  const bgColor = settings?.card_bg_color ?? "#5B21B6";
  const senderColor = settings?.sender_color ?? "#FFDF20";
  const amountColor = settings?.amount_color ?? "#A3E635";
  const messageColor = settings?.message_color ?? "#ffffff";

  const content = (
    <>
      {/* Header Bar */}
      <div className="bg-black/20 p-4 border-b-4 border-black flex items-center justify-center">
        <h3 className="font-[family-name:var(--font-pixel)] text-lg text-white uppercase tracking-widest text-center pt-1 drop-shadow-md">
          New Donation
        </h3>
      </div>

      {/* Content Body */}
      <div className="p-6 flex flex-col gap-4">
        {/* Donor Name */}
        <h2
          className="text-3xl font-bold font-[family-name:var(--font-pixel-body)] tracking-wide drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]"
          style={{ color: senderColor }}
        >
          {data.donor_name}
        </h2>

        {/* Message */}
        {data.message && (
          <p
            className="text-xl leading-relaxed font-[family-name:var(--font-pixel-body)]"
            style={{ color: messageColor }}
          >
            {data.message}
          </p>
        )}

        {/* Amount */}
        <div className="mt-2">
          <p
            className="text-2xl font-bold font-[family-name:var(--font-pixel)] drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] tracking-widest"
            style={{ color: amountColor }}
          >
            {data.amount_net.toLocaleString()} USDC
          </p>
        </div>
      </div>
    </>
  );

  const sharedClassName =
    "w-full max-w-md overflow-hidden border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]";

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
      exit={{ y: 20, opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={sharedClassName}
      style={{ backgroundColor: bgColor }}
    >
      {content}
    </motion.div>
  );
}
