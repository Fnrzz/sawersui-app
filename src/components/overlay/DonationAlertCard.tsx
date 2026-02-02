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
      className="w-full max-w-md overflow-hidden border-4 border-black bg-[#5b21b6] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
    >
      {/* Header Bar */}
      <div className="bg-black/20 p-4 border-b-4 border-black flex items-center justify-center">
         <h3 className="font-[family-name:var(--font-pixel)] text-lg text-white uppercase tracking-widest text-center pt-1 drop-shadow-md">
           New Donation
         </h3>
      </div>

      {/* Content Body */}
      <div className="p-6 flex flex-col gap-4">
        
        {/* Donor Name */}
        <h2 className="text-3xl font-bold text-yellow-300 font-[family-name:var(--font-pixel-body)] tracking-wide drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
          {data.donor_name}
        </h2>

        {/* Message */}
        {data.message && (
            <p className="text-xl text-white leading-relaxed font-[family-name:var(--font-pixel-body)]">
              {data.message}
            </p>
        )}

        {/* Amount */}
        <div className="mt-2">
           <p className="text-2xl font-bold text-[#a3e635] font-[family-name:var(--font-pixel)] drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] tracking-widest">
             {data.amount_net.toLocaleString()} USDC
           </p>
        </div>
      </div>
    </motion.div>
  );
}
