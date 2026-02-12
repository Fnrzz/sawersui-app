"use client";

import { useState, useCallback } from "react";
import { useDonationEvents } from "@/hooks/useDonationEvents";
import { getLeaderboard, LeaderboardEntry } from "@/lib/actions/leaderboard";
import { AnimatePresence, motion } from "framer-motion";

interface RealtimeLeaderboardProps {
  initialData: LeaderboardEntry[];
  streamerId: string;
}

export function RealtimeLeaderboard({
  initialData,
  streamerId,
}: RealtimeLeaderboardProps) {
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
      <div className="bg-white border-[3px] border-black rounded-xl p-0 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        <div className="bg-[#FFB7B2] p-4 border-b-[3px] border-black flex items-center justify-center gap-3">
          <h2 className="font-[family-name:var(--font-pixel)] text-lg text-black uppercase tracking-widest text-center pt-1 drop-shadow-sm">
            Top Supporters
          </h2>
        </div>

        <div className="p-4 space-y-3 bg-white">
          <AnimatePresence mode="popLayout">
            {data.slice(0, 5).map((entry, index) => (
              <motion.div
                key={entry.donorName}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-black/5 transition-colors border-b-2 border-black/5 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 flex items-center justify-center bg-black text-white font-[family-name:var(--font-pixel)] text-sm rounded-md border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]">
                    {index + 1}
                  </div>
                  <span className="font-[family-name:var(--font-pixel-body)] font-bold text-lg text-black truncate max-w-[150px] tracking-wide">
                    {entry.donorName}
                  </span>
                </div>
                <div className="font-[family-name:var(--font-pixel-body)] font-bold text-lg text-black tracking-wide text-right">
                  {entry.totalAmount.toLocaleString()}{" "}
                  <span className="text-sm text-black/60">USDC</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {data.length === 0 && (
            <div className="p-8 text-center flex flex-col items-center gap-2">
              <div className="text-4xl">🦗</div>
              <div className="text-sm font-[family-name:var(--font-pixel-body)] text-black/50 font-bold uppercase tracking-widest">
                No donations yet
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
