"use client";

import { useState } from "react";
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
  Wallet,
  LogOut,
  Flag,
} from "lucide-react";
import { toast } from "sonner";
import { motion, Variants } from "framer-motion";
import { MenuCard } from "@/components/dashboard/MenuCard";
import { WithdrawModal } from "@/components/dashboard/WithdrawModal";
import { useBalances } from "@/hooks/useBalances";

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
  suiBalance: string;
  totalDonations: number;
  lastDonation: Donation | null;
  recentDonations: Donation[];
  walletAddress: string | null;
}

export function DashboardOverview({
  displayName,
  username,
  usdcBalance: initialUsdcBalance,
  suiBalance: initialSuiBalance,
  walletAddress,
}: DashboardOverviewProps) {
  const t = useTranslations("Dashboard");
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const { mutate: disconnect } = useDisconnectWallet();
  const { logout: zkLogout, isAuthenticated } = useZkLogin();

  // Real-time balance updates
  const { balances } = useBalances(walletAddress);

  // Use live balances if available (and non-zero/loaded), else initial
  const displayUsdc =
    balances.usdc > 0 ? balances.usdc.toFixed(2) : initialUsdcBalance;
  const displaySui =
    balances.sui > 0 ? balances.sui.toFixed(4) : initialSuiBalance;

  const handleLogout = async () => {
    try {
      // Disconnect wallet/zkLogin first
      disconnect();
      await zkLogout();

      // Sign out of Supabase
      await supabase.auth.signOut();

      router.push("/");
      toast.success(t("toast.logoutSuccess"));
    } catch {
      toast.error("Error logging out");
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
          href="/dashboard/share"
        />

        {/* Dukungan Masuk & Cashout - Purple */}
        <MenuCard
          title={t("menu.balance.title")}
          // description={t("menu.balance.desc", { balance: usdcBalance })} // Old
          description={`${displayUsdc} USDC | ${displaySui} SUI`} // Custom display overriding locale for now or could update locale
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

        {/* Riwayat / History - Yellow */}
        <MenuCard
          title={t("menu.history.title")}
          description={t("menu.history.desc")}
          icon={History}
          colorClass="bg-[#FDE68A]" // Amber-200ish
          href="/dashboard/history"
        />

        {/* Milestones - Green */}
        <MenuCard
          title={t("menu.milestone.title")}
          description={t("menu.milestone.desc")}
          icon={Flag}
          colorClass="bg-[#C1E1C1]" // Green-200ish
          href="/dashboard/milestone"
        />
      </motion.div>

      {/* Withdraw Dialog */}
      <WithdrawModal
        open={isWithdrawOpen}
        onOpenChange={setIsWithdrawOpen}
        usdcBalance={displayUsdc}
        suiBalance={displaySui}
      />
    </motion.div>
  );
}
