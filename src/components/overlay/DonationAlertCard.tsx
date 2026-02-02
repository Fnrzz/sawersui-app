"use client";

import { motion } from "framer-motion";
import { DonationEvent } from "@/hooks/useDonationEvents";

export function DonationAlertCard({ data }: { data: DonationEvent }) {
  return (
    <motion.div
      initial={{ y: 50, opacity: 0, scale: 0.9 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: 20, opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="w-full max-w-md overflow-hidden rounded-md shadow-[6px_6px_0px_0px_rgba(0,0,0,0.5)] border-4 border-black bg-[#6d28d9]"
    >
      <div className="p-5 flex flex-col gap-3">
        {/* Header: Donor Name */}
        <h2 className="text-2xl font-black text-[#a3e635] tracking-wide font-[family-name:var(--font-pixel)] drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
          {data.donor_name}
        </h2>

        {/* Message Body */}
        {data.message && (
          <p className="text-sm text-white leading-relaxed font-[family-name:var(--font-pixel)]">
             {data.message}
          </p>
        )}

        {/* Footer: Amount */}
        <div className="mt-1">
           <p className="text-xl font-black text-[#a3e635] font-[family-name:var(--font-pixel)] drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
             {data.amount_net} USDC
           </p>
        </div>
      </div>
    </motion.div>
  );
}
