"use client";

import { Copy, Share2, History, Settings, Wallet } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useWithdraw } from "@/hooks/useWithdraw";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { enokiFlow } from "@/lib/enoki/client";
import { jwtDecode } from "jwt-decode";
import { useZkLogin } from "@/hooks/useZkLogin";

interface DashboardQuickActionsProps {
  username: string;
}

export function DashboardQuickActions({
  username,
}: DashboardQuickActionsProps) {
  const [copied, setCopied] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { withdraw } = useWithdraw();

  const getDonationLink = () => {
    return `${window.location.origin}/${username}`;
  };

  const handleCopyLink = () => {
    const link = getDonationLink();
    navigator.clipboard
      .writeText(link)
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
      title: "Support me on SawerSui",
      text: `Support ${username} on SawerSui!`,
      url: link,
    };

    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error("Share failed", err);
      }
    } else {
      handleCopyLink();
    }
  };

  const handleWithdraw = async () => {
    try {
      setIsLoading(true);
      const val = parseFloat(amount);
      if (isNaN(val) || val < 0.5) {
        toast.error("Minimum withdrawal is 0.5 USDC");
        setIsLoading(false);
        return;
      }
      if (!recipient.startsWith("0x") || recipient.length < 60) {
        // Basic length check, real validation in hook
        if (recipient.length < 50) {
          // SUI addresses are 66 chars usually
          toast.error("Invalid address format");
          setIsLoading(false);
          return;
        }
      }

      const res = await withdraw({ amount: val, recipientAddress: recipient });
      console.log("Withdrawal success:", res);
      toast.success("Withdrawal successful!");
      setIsWithdrawOpen(false);
      setAmount("");
      setRecipient("");
    } catch (e: unknown) {
      console.error("Withdrawal error:", e);
      const msg = e instanceof Error ? e.message : "Withdrawal failed";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const { isAuthenticated } = useZkLogin(); // We need to check if they are logged in. Ideally we also check provider.
  // For strict UI hiding, we would decode JWT here too, but checking isAuthenticated + generic Withdraw error handling is a good start.
  // Requirement: "show ... if users login only via google email"
  // Let's decode JWT here as well to be precise for the UI state.

  const [isGoogleUser, setIsGoogleUser] = useState(false);

  useEffect(() => {
    const checkProvider = async () => {
      const session = await enokiFlow.getSession();
      if (session && session.jwt) {
        try {
          const decoded = jwtDecode<{ iss: string }>(session.jwt);
          if (decoded.iss === "https://accounts.google.com") {
            setIsGoogleUser(true);
          }
        } catch (e) {
          console.error("Values error", e);
        }
      }
    };
    checkProvider();
  }, []);

  const actions = [
    {
      icon: Copy,
      label: copied ? "Copied!" : "Copy Link",
      onClick: handleCopyLink,
    },
    {
      icon: Share2,
      label: "Share",
      onClick: handleShare,
    },
    ...(isGoogleUser
      ? [
          {
            icon: Wallet,
            label: "Withdraw",
            onClick: () => setIsWithdrawOpen(true),
          },
        ]
      : []),
    {
      icon: Settings,
      label: "OBS Settings",
      href: "/dashboard/obs",
    },
    {
      icon: History,
      label: "History",
      href: "/dashboard/history",
    },
  ];

  return (
    <>
      <div className="grid grid-cols-4 gap-4">
        {actions.map((action, i) =>
          action.href ? (
            <Link
              key={i}
              href={action.href}
              className="flex flex-col items-center gap-3 group"
            >
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
              <span
                className={`text-xs font-medium transition-colors ${action.label === "Copied!" ? "text-green-500 font-bold" : "text-gray-500 dark:text-gray-400 group-hover:text-black dark:group-hover:text-white"}`}
              >
                {action.label}
              </span>
            </button>
          ),
        )}
      </div>

      <Dialog open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Withdraw USDC</DialogTitle>
            <DialogDescription>
              Sponsored withdrawal (Gas-free). Minimum 0.5 USDC.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount (USDC)</label>
              <input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Recipient Address</label>
              <input
                type="text"
                placeholder="0x..."
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setIsWithdrawOpen(false)}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
            >
              Cancel
            </button>
            <button
              onClick={handleWithdraw}
              disabled={isLoading}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Withdraw
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
