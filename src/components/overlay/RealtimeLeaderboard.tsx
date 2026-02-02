"use client";

import { useState, useCallback } from "react";
import { useDonationEvents } from "@/hooks/useDonationEvents";
import { getLeaderboard, LeaderboardEntry } from "@/lib/actions/leaderboard";
import { AnimatePresence, motion } from "framer-motion";

interface RealtimeLeaderboardProps {
  initialData: LeaderboardEntry[];
  streamerId: string;
}

export function RealtimeLeaderboard({ initialData, streamerId }: RealtimeLeaderboardProps) {
  const [data, setData] = useState<LeaderboardEntry[]>(initialData);

  // Function to refresh leaderboard data
  const refreshLeaderboard = useCallback(async () => {
    try {
      const newData = await getLeaderboard(streamerId);
      setData(newData);
    } catch (error) {
      console.error("Failed to refresh leaderboard:", error);
    }
  }, [streamerId]);

  // Subscribe to new donations
  useDonationEvents(streamerId, () => {
    // When any new donation comes in, refresh the leaderboard
    refreshLeaderboard();
  });

  return (
    <div className="w-96 font-sans">
      <div className="bg-[#5b21b6] border-4 border-black p-0 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="bg-black/20 p-4 border-b-4 border-black flex items-center justify-center gap-3">
            <h2 className="font-[family-name:var(--font-pixel)] text-base text-[#a3e635] uppercase tracking-wider text-center pt-2">
              Leaderboard
            </h2>
        </div>
        
        <div className="p-4 space-y-3">
          <AnimatePresence mode="popLayout">
            {data.slice(0, 5).map((entry, index) => (
              <motion.div
                key={entry.donorName}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="font-[family-name:var(--font-pixel)] text-sm text-white w-6">
                    {index + 1}.
                  </span>
                  <span className="font-[family-name:var(--font-pixel-body)] font-bold text-xl text-white truncate max-w-[160px] tracking-wide">
                    {entry.donorName}
                  </span>
                </div>
                <div className="font-[family-name:var(--font-pixel-body)] font-bold text-xl text-white tracking-wide text-right">
                  {entry.totalAmount.toLocaleString()} usdc
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {data.length === 0 && (
            <div className="p-6 text-center text-sm font-[family-name:var(--font-pixel-body)] text-white/50 tracking-wider">
                WAITING FOR DONATIONS...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
