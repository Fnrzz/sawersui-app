"use client";

import { useState } from "react";
import { Lock, Unlock, Eye, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CONFIG } from "@/lib/config";
import type { GatedContentWithAccess } from "@/lib/seal";

interface ExclusiveContentListProps {
  contents: GatedContentWithAccess[];
  streamerName: string;
}

export function ExclusiveContentList({
  contents,
  streamerName,
}: ExclusiveContentListProps) {
  const [revealedId, setRevealedId] = useState<string | null>(null);
  const [revealedContent, setRevealedContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleReveal = async (contentId: string, blobId: string) => {
    if (revealedId === contentId) {
      setRevealedId(null);
      setRevealedContent(null);
      return;
    }

    setIsLoading(true);
    try {
      const url = `${CONFIG.WALRUS.AGGREGATOR_URL}/v1/blobs/${blobId}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch content");
      const text = await response.text();
      setRevealedContent(text);
      setRevealedId(contentId);
    } catch {
      setRevealedContent("Failed to load content.");
      setRevealedId(contentId);
    } finally {
      setIsLoading(false);
    }
  };

  if (contents.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Lock className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No exclusive content available yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {contents.map((content) => (
        <div
          key={content.id}
          className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden"
        >
          <div className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {content.has_access ? (
                    <Unlock className="w-4 h-4 text-green-500 flex-shrink-0" />
                  ) : (
                    <Lock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  )}
                  <h3 className="font-bold text-gray-900 dark:text-white truncate">
                    {content.title}
                  </h3>
                </div>
                {content.description && (
                  <p className="text-sm text-gray-500 mt-1">
                    {content.description}
                  </p>
                )}
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-bold flex-shrink-0">
                {content.min_donation_usdc} USDC
              </span>
            </div>

            {content.has_access ? (
              <button
                onClick={() =>
                  handleReveal(content.id, (content as { walrus_blob_id?: string }).walrus_blob_id || "")
                }
                disabled={isLoading}
                className="mt-3 w-full py-2 rounded-lg bg-green-600 text-white text-sm font-bold hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {isLoading && revealedId !== content.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
                {revealedId === content.id ? "Hide Content" : "View Content"}
              </button>
            ) : (
              <div className="mt-3 p-3 rounded-lg bg-gray-50 dark:bg-zinc-800 text-center">
                <p className="text-sm text-gray-500">
                  Donate at least{" "}
                  <span className="font-bold text-purple-600 dark:text-purple-400">
                    {content.min_donation_usdc} USDC
                  </span>{" "}
                  to {streamerName} to unlock
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Your total:{" "}
                  {content.total_donated.toFixed(2)} USDC
                </p>
              </div>
            )}
          </div>

          <AnimatePresence>
            {revealedId === content.id && revealedContent && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-gray-100 dark:border-white/5"
              >
                <div className="p-4 bg-green-50 dark:bg-green-900/10">
                  <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                    {revealedContent}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}
