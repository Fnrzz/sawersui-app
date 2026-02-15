"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface Milestone {
  id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  status: string;
  created_at: string;
  walrus_url: string;
  coin_type?: string;
  image_blob_id: string;
  expiration_epoch?: number;
  expires_at?: string;
}

interface MilestoneDetailModalProps {
  milestone: Milestone;
  trigger?: React.ReactNode;
}

export function MilestoneDetailModal({
  milestone,
  trigger,
}: MilestoneDetailModalProps) {
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
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="w-full p-0 overflow-hidden border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sm:rounded-xl">
        <DialogHeader className="p-6 pb-2">
          <div className="flex justify-between items-start pr-8">
            <DialogTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
              Milestone Details
            </DialogTitle>
            <Badge
              variant="outline"
              className={`border-2 ${getStatusColor(
                milestone.status,
              )} uppercase font-bold px-3 py-1 text-xs`}
            >
              {milestone.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="p-6 pt-2 grid md:grid-cols-12 gap-8">
          {/* Left Column: Image (5 cols) */}
          <div className="md:col-span-5 space-y-4">
            <div className="relative aspect-square w-full rounded-xl border-2 border-black overflow-hidden bg-gray-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={milestone.walrus_url}
                alt={milestone.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-2">
              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                Blob ID
              </p>
              <div className="text-[10px] font-mono break-all bg-gray-50 p-2 rounded border border-gray-200 text-gray-600">
                {milestone.image_blob_id}
              </div>
            </div>
          </div>

          {/* Right Column: Details (7 cols) */}
          <div className="md:col-span-7 flex flex-col h-full">
            <div className="flex-1 space-y-6">
              {/* Title Section */}
              <div>
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                  Title
                </p>
                <h2 className="text-2xl font-bold leading-tight text-black mt-1">
                  {milestone.title}
                </h2>
              </div>

              {/* Target Section */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                  Fundraising Goal
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-4xl font-black tracking-tighter">
                    {milestone.current_amount.toFixed(2)}
                  </span>
                  <span className="text-xl text-gray-400 font-medium">
                    / {milestone.target_amount.toFixed(2)}
                  </span>
                  <Badge
                    variant="outline"
                    className="ml-auto border-black bg-white"
                  >
                    {milestone.coin_type?.includes("sui") ? "SUI" : "USDC"}
                  </Badge>
                </div>
                <div className="w-full bg-gray-200 h-2 rounded-full mt-3 overflow-hidden">
                  <div
                    className="bg-black h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min((milestone.current_amount / milestone.target_amount) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Storage Section — expiry badge only, renewal is automated */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider flex items-center gap-2">
                    Walrus Storage
                  </p>
                  <Badge
                    variant={
                      milestone.expires_at || milestone.expiration_epoch
                        ? "secondary"
                        : "destructive"
                    }
                    className="font-mono text-[10px]"
                  >
                    {milestone.expires_at
                      ? `Expires: ${new Date(milestone.expires_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}`
                      : milestone.expiration_epoch
                        ? `Expires: Epoch ${milestone.expiration_epoch}`
                        : "Expiration Unknown"}
                  </Badge>
                </div>
                <p className="text-[10px] text-center text-gray-400 max-w-xs mx-auto">
                  Storage is automatically renewed daily by the system.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
