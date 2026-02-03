"use client";

import { Copy, Share2, History, Trophy, Settings } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useState } from "react";

interface DashboardQuickActionsProps {
  username: string;
}

export function DashboardQuickActions({ username }: DashboardQuickActionsProps) {
  const [copied, setCopied] = useState(false);

  const getDonationLink = () => {
    return `${window.location.origin}/${username}`;
  };

  const handleCopyLink = () => {
    const link = getDonationLink();
    navigator.clipboard.writeText(link)
      .then(() => {
        toast.success("Donation link copied!");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => toast.error("Failed to copy link"));
  };

  const handleShare = async () => {
    const link = getDonationLink();
    const shareData = {
      title: 'Support me on SawerSui',
      text: `Support ${username} on SawerSui!`,
      url: link
    };

    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // user aborted or error
        console.error("Share failed", err);
      }
    } else {
      // Fallback to copy
      handleCopyLink();
    }
  };

  const actions = [
    { 
      icon: Copy, 
      label: copied ? "Copied!" : "Copy Link", 
      onClick: handleCopyLink 
    },
    { 
      icon: Share2, 
      label: "Share", 
      onClick: handleShare 
    },
    { 
        icon: Settings, 
        label: "OBS Settings", 
        href: "/dashboard/obs" 
    },
    { 
      icon: History, 
      label: "History", 
      href: "/dashboard/history" 
    },
  ];

  return (
    <div className="flex justify-between px-2">
      {actions.map((action, i) => (
        action.href ? (
          <Link key={i} href={action.href} className="flex flex-col items-center gap-3 group">
            <div className="w-16 h-16 rounded-full bg-white dark:bg-zinc-900 border border-gray-100 dark:border-white/10 shadow-sm flex items-center justify-center group-hover:scale-105 transition-transform group-active:scale-95 text-gray-600 dark:text-gray-300">
              <action.icon className="w-7 h-7" />
            </div>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 group-hover:text-black dark:group-hover:text-white transition-colors">
              {action.label}
            </span>
          </Link>
        ) : (
          <button 
            key={i} 
            onClick={action.onClick}
            className="flex flex-col items-center gap-3 group"
          >
            <div className="w-16 h-16 rounded-full bg-white dark:bg-zinc-900 border border-gray-100 dark:border-white/10 shadow-sm flex items-center justify-center group-hover:scale-105 transition-transform group-active:scale-95 text-gray-600 dark:text-gray-300">
              <action.icon className="w-7 h-7" />
            </div>
            <span className={`text-xs font-medium transition-colors ${action.label === "Copied!" ? "text-green-500 font-bold" : "text-gray-500 dark:text-gray-400 group-hover:text-black dark:group-hover:text-white"}`}>
              {action.label}
            </span>
          </button>
        )
      ))}
    </div>
  );
}
