"use client";

import { useTranslations } from "next-intl";

import { useState, useCallback, useEffect } from "react";
import { useDonationEvents } from "@/hooks/useDonationEvents";
import { getLeaderboard, LeaderboardEntry } from "@/lib/actions/leaderboard";
import {
  LeaderboardSettings,
  DEFAULT_LEADERBOARD_SETTINGS,
} from "@/lib/leaderboard-settings";
import { getLeaderboardSettings as fetchSettings } from "@/lib/actions/leaderboard-settings"; // Import the server action
import { AnimatePresence, motion } from "framer-motion";

interface RealtimeLeaderboardProps {
  initialData: LeaderboardEntry[];
  streamerId: string;
  previewSettings?: LeaderboardSettings;
}

export function RealtimeLeaderboard({
  initialData,
  streamerId,
  previewSettings,
}: RealtimeLeaderboardProps) {
  const t = useTranslations("Overlay");
  const [data, setData] = useState<LeaderboardEntry[]>(initialData);
  const [settings, setSettings] = useState<LeaderboardSettings | null>(
    previewSettings || null,
  );

  // Fetch settings on mount if not provided and not preview
  useEffect(() => {
    if (!previewSettings && streamerId !== "preview") {
      fetchSettings(streamerId).then((s) => {
        setSettings(s);
      });
    }
  }, [streamerId, previewSettings]);

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

  const effectiveSettings = previewSettings ||
    settings || {
      user_id: "",
      ...DEFAULT_LEADERBOARD_SETTINGS,
    };

  return (
    <div className="w-96 font-sans">
      <div
        className="border-[3px] border-black rounded-xl p-0 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden transition-colors duration-300"
        style={{ backgroundColor: effectiveSettings.bg_color }}
      >
        <div className="bg-black/10 p-4 border-b-[3px] border-black flex items-center justify-center gap-3">
          <h2
            className="font-[family-name:var(--font-pixel)] text-lg uppercase tracking-widest text-center pt-1 drop-shadow-sm transition-colors duration-300"
            style={{ color: effectiveSettings.title_color }}
          >
            {t("topSupporters")}
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
                className="flex items-center justify-between p-2 rounded-lg hover:bg-black/5 transition-colors border-b-2 border-black/5 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 flex items-center justify-center font-[family-name:var(--font-pixel)] text-sm rounded-md border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)] transition-colors duration-300"
                    style={{
                      backgroundColor: effectiveSettings.rank_color,
                      color: "#000",
                    }}
                  >
                    {index + 1}
                  </div>
                  <span
                    className="font-[family-name:var(--font-pixel-body)] font-bold text-lg truncate max-w-[150px] tracking-wide transition-colors duration-300"
                    style={{ color: effectiveSettings.text_color }}
                  >
                    {entry.donorName}
                  </span>
                </div>
                <div
                  className="font-[family-name:var(--font-pixel-body)] font-bold text-lg tracking-wide text-right transition-colors duration-300"
                  style={{ color: effectiveSettings.text_color }}
                >
                  {entry.totalAmount.toLocaleString()}{" "}
                  <span className="text-sm opacity-60">{entry.coinType}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {data.length === 0 && (
            <div className="p-8 text-center flex flex-col items-center gap-2">
              <div className="text-4xl">🦗</div>
              <div
                className="text-sm font-[family-name:var(--font-pixel-body)] font-bold uppercase tracking-widest transition-colors duration-300"
                style={{ color: effectiveSettings.text_color, opacity: 0.5 }}
              >
                {t("noDonations")}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
