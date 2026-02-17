"use client";

import { useEffect, useState, useTransition } from "react";
import { getMilestones, cancelMilestone } from "@/lib/actions/milestone";
import { MilestoneDetailModal } from "@/components/dashboard/MilestoneDetailModal";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";

interface Milestone {
  id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  status: string;
  created_at: string;
  walrus_url: string;
  image_blob_id: string;
  coin_type?: string;
  expiration_epoch?: number;
  expires_at?: string;
}

export function MilestoneList() {
  const t = useTranslations("Milestone.history");
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  const fetchMilestones = async () => {
    try {
      const data = await getMilestones();
      setMilestones(data as Milestone[]);
    } catch (error) {
      console.error("Failed to fetch milestones:", error);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchMilestones();
  }, []);

  const handleCancel = (id: string) => {
    if (!confirm(t("cancelConfirm"))) return;

    startTransition(async () => {
      const result = await cancelMilestone(id);
      if (result.success) {
        toast.success(t("cancelSuccess"));
        fetchMilestones(); // Refresh list
      } else {
        toast.error(result.error);
      }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "minted":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold">{t("yourMilestones")}</h3>

      <div className="grid gap-4">
        <AnimatePresence>
          {milestones.length === 0 ? (
            <p className="text-gray-500 italic">{t("empty")}</p>
          ) : (
            milestones.map((milestone) => (
              <motion.div
                key={milestone.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -10 }}
                layout
              >
                <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] transition-all">
                  <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      {/* Thumbnail */}
                      <div className="w-16 h-16 bg-gray-100 border border-black rounded overflow-hidden flex-shrink-0">
                        {failedImages.has(milestone.id) ? (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-[10px] font-bold text-center p-1">
                            Expired
                          </div>
                        ) : (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={milestone.walrus_url}
                            alt={milestone.title}
                            className="w-full h-full object-cover"
                            onError={() =>
                              setFailedImages((prev) =>
                                new Set(prev).add(milestone.id),
                              )
                            }
                          />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-bold text-base sm:text-lg truncate">
                            {milestone.title}
                          </h4>
                          <Badge
                            variant="outline"
                            className={`border ${getStatusColor(milestone.status)} uppercase text-[10px] sm:text-xs font-bold whitespace-nowrap`}
                          >
                            {milestone.status}
                          </Badge>
                        </div>
                        <div className="text-sm font-mono mt-1 text-gray-600">
                          {milestone.current_amount.toFixed(2)} /{" "}
                          {milestone.target_amount.toFixed(2)}{" "}
                          {milestone.coin_type?.includes("sui")
                            ? "SUI"
                            : "USDC"}
                        </div>
                        {milestone.expires_at ? (
                          <div className="text-xs text-gray-500 mt-1">
                            Expires:{" "}
                            {new Date(milestone.expires_at).toLocaleDateString(
                              undefined,
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              },
                            )}
                          </div>
                        ) : milestone.expiration_epoch ? (
                          <div className="text-xs text-gray-500 mt-1">
                            Expires: Epoch {milestone.expiration_epoch}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {!failedImages.has(milestone.id) && (
                        <a
                          href={milestone.walrus_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            title="View Image"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </a>
                      )}
                      <MilestoneDetailModal
                        milestone={milestone}
                        trigger={
                          <Button
                            variant="outline"
                            size="sm"
                            title="View Details"
                          >
                            Details
                          </Button>
                        }
                      />
                      {milestone.status === "active" && (
                        <Button
                          variant="destructive"
                          size="icon"
                          disabled={isPending}
                          onClick={() => handleCancel(milestone.id)}
                          title="Cancel Milestone"
                          className="border-2 border-transparent hover:border-black"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
