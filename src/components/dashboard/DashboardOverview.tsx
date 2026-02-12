"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useDisconnectWallet } from "@mysten/dapp-kit";
import { useZkLogin } from "@/hooks/useZkLogin";
import { useTranslations } from "next-intl";
import {
  MonitorPlay,
  Share2,
  History,
  User,
  ExternalLink,
  Copy,
  Wallet,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";
import { motion, Variants } from "framer-motion";
import { MenuCard } from "@/components/dashboard/MenuCard";
import { useWithdraw } from "@/hooks/useWithdraw";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: "easeOut" },
  },
};

interface Donation {
  id: string;
  donor_name: string;
  amount_net: number;
  message: string;
  created_at: string;
  tx_digest: string;
}

interface DashboardOverviewProps {
  displayName: string;
  username: string;
  usdcBalance: string;
  totalDonations: number;
  lastDonation: Donation | null;
  recentDonations: Donation[];
  walletAddress: string | null;
}

export function DashboardOverview({
  displayName,
  username,
  usdcBalance,
}: DashboardOverviewProps) {
  const t = useTranslations("Dashboard");
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { withdraw } = useWithdraw();
  const router = useRouter();
  const supabase = createClient();
  const { mutate: disconnect } = useDisconnectWallet();
  const { logout: zkLogout, isAuthenticated } = useZkLogin();

  const handleLogout = async () => {
    try {
      // Disconnect wallet/zkLogin first
      disconnect();
      await zkLogout();

      // Sign out of Supabase
      await supabase.auth.signOut();

      router.push("/");
      toast.success(t("toast.logoutSuccess"));
    } catch (error) {
      toast.error("Error logging out");
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/${username}`;
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success(t("toast.copySuccess")))
      .catch(() => toast.error(t("toast.copyError")));
  };

  const handleWithdraw = async () => {
    try {
      setIsLoading(true);
      const val = parseFloat(amount);
      if (isNaN(val) || val < 0.5) {
        toast.error(t("withdraw.minAmount"));
        setIsLoading(false);
        return;
      }
      if (!recipient.startsWith("0x") || recipient.length < 50) {
        toast.error(t("withdraw.invalidAddress"));
        setIsLoading(false);
        return;
      }

      await withdraw({ amount: val, recipientAddress: recipient });
      toast.success(t("withdraw.success"));
      setIsWithdrawOpen(false);
      setAmount("");
      setRecipient("");
    } catch (e: unknown) {
      console.error("Withdrawal error:", e);
      const msg = e instanceof Error ? e.message : t("withdraw.error");
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      className="space-y-8"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Greeting */}
      <motion.div
        variants={itemVariants}
        className="flex items-center justify-between"
      >
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl md:text-4xl font-black text-black">
            {t.rich("hello", { name: displayName })}
          </h1>
          <p className="text-black/60 font-medium text-lg">{t("subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/dashboard/profile")}
            className="p-2 rounded-lg hover:bg-black/5 transition-colors text-black/60 hover:text-black"
            title="Profile"
          >
            <User className="w-6 h-6" />
          </button>
          <button
            onClick={handleLogout}
            className="p-2 -mr-2 rounded-lg hover:bg-black/5 transition-colors text-black/60 hover:text-red-500"
            title="Logout"
          >
            <LogOut className="w-6 h-6" />
          </button>
        </div>
      </motion.div>

      {/* Main Grid */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {/* Overlay Card - Cyan */}
        <MenuCard
          title={t("menu.overlay.title")}
          description={t("menu.overlay.desc")}
          icon={MonitorPlay}
          colorClass="bg-[#BAE6FD]" // Cyan-200ish
          href="/dashboard/obs"
        />

        {/* KirimKirim / Share - Blue */}
        <MenuCard
          title={t("menu.share.title")}
          description={t("menu.share.desc")}
          icon={Share2}
          colorClass="bg-[#BFDBFE]" // Blue-200ish
          onClick={handleCopyLink}
          actionLabel={t("menu.share.action")}
        />

        {/* Dukungan Masuk & Cashout - Purple */}
        <MenuCard
          title={t("menu.balance.title")}
          description={t("menu.balance.desc", { balance: usdcBalance })}
          icon={Wallet}
          colorClass="bg-[#DDD6FE]" // Violet-200ish
          onClick={() => {
            if (isAuthenticated) {
              setIsWithdrawOpen(true);
            } else {
              toast.info(t("withdraw.loginRequired"));
            }
          }}
          actionLabel={t("menu.balance.action")}
        />

        {/* Riwayat Donasi - Orange */}
        <MenuCard
          title={t("menu.history.title")}
          description={t("menu.history.desc")}
          icon={History}
          colorClass="bg-[#FED7AA]" // Orange-200ish
          href="/dashboard/history"
        />
      </motion.div>

      {/* Withdraw Dialog */}
      <Dialog open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("withdraw.title")}</DialogTitle>
            <DialogDescription>{t("withdraw.desc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("withdraw.amount")}
              </label>
              <input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("withdraw.recipient")}
              </label>
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
              {t("withdraw.cancel")}
            </button>
            <button
              onClick={handleWithdraw}
              disabled={isLoading}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("menu.balance.action")}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
