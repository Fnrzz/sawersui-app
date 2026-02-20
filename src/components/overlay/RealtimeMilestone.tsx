"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Flag, CheckCircle2 } from "lucide-react";
import confetti from "canvas-confetti";

interface Milestone {
  id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  image_url: string;
  status: string;
}

interface RealtimeMilestoneProps {
  streamerId: string;
  initialData?: Milestone | null;
  preview?: boolean;
}

export function RealtimeMilestone({
  streamerId,
  initialData = null,
  preview = false,
}: RealtimeMilestoneProps) {
  const [milestone, setMilestone] = useState<Milestone | null>(
    preview
      ? {
          id: "preview-id",
          title: "Example Milestone Goal",
          target_amount: 100,
          current_amount: 45.5,
          image_url: "https://picsum.photos/seed/milestone/800/400",
          status: "active",
        }
      : initialData,
  );
  const [imgError, setImgError] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (preview) return;

    // 2. Subscribe to changes
    if (!streamerId) return;

    const channel = supabase
      .channel(`milestone-updates-${streamerId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "milestones",
          filter: `streamer_id=eq.${streamerId}`,
        },
        (payload) => {
          const newRecord = payload.new as Milestone;

          // Handle UPDATE
          if (payload.eventType === "UPDATE") {
            if (newRecord.status === "cancelled") {
              setMilestone(null);
            } else {
              setMilestone(newRecord);
            }
          }
          // Handle INSERT (new milestone created)
          else if (payload.eventType === "INSERT") {
            if (newRecord.status === "active") {
              setMilestone(newRecord);
            }
          }
        },
      )
      .subscribe(() => {});

    return () => {
      supabase.removeChannel(channel);
    };
  }, [streamerId, preview]); // eslint-disable-line react-hooks/exhaustive-deps

  // Effect to trigger confetti on completion
  useEffect(() => {
    if (
      milestone &&
      milestone.current_amount >= milestone.target_amount &&
      milestone.status === "active"
    ) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#BEF264", "#000000", "#FFFFFF"], // Lime, Black, White
      });
    }
  }, [milestone]);

  if (!milestone) {
    return null; // Don't show anything if no active milestone
  }

  const progress = Math.min(
    (milestone.current_amount / milestone.target_amount) * 100,
    100,
  );
  const isCompleted = milestone.current_amount >= milestone.target_amount;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={milestone.id}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-[400px] border-[3px] border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden rounded-xl font-sans"
      >
        {/* Header Image */}
        <div className="h-32 w-full relative bg-gray-100 border-b-[3px] border-black overflow-hidden group">
          {imgError ? (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm font-bold">
              Image Expired
            </div>
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={milestone.image_url}
              alt={milestone.title}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          )}
          {isCompleted && (
            <div className="absolute inset-0 bg-lime-300/80 flex items-center justify-center backdrop-blur-sm">
              <motion.div
                initial={{ scale: 0, rotate: 0 }}
                animate={{ scale: 1.2, rotate: [0, 10, -10, 0] }}
                transition={{
                  scale: { type: "spring", stiffness: 300, damping: 10 },
                  rotate: { duration: 0.5, ease: "easeInOut" },
                }}
              >
                <CheckCircle2 className="w-16 h-16 text-black" />
              </motion.div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-black text-xl leading-tight uppercase line-clamp-2">
              {milestone.title}
            </h3>
            {isCompleted ? (
              <span className="bg-[#BEF264] text-xs font-bold px-2 py-1 border border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] whitespace-nowrap">
                COMPLETED
              </span>
            ) : (
              <span className="bg-zinc-200 text-xs font-bold px-2 py-1 border border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1 whitespace-nowrap">
                <Flag className="w-3 h-3" />
                ACTIVE
              </span>
            )}
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm font-bold">
              <span>{milestone.current_amount.toFixed(2)} USDC</span>
              <span>{milestone.target_amount.toFixed(2)} USDC</span>
            </div>
            <div className="h-6 w-full border-[2px] border-black rounded-full p-0.5 bg-zinc-100">
              <motion.div
                className="h-full rounded-full bg-[#BEF264] border border-black"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
