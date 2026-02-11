"use client";

import { useState } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { Loader2, Send, CheckCircle, AlertCircle } from "lucide-react";
import { useDonate } from "@/hooks/useDonate";
import { useZkDonation } from "@/hooks/useZkDonation";
import { saveDonation, StreamerProfile } from "@/lib/actions/donation";
import { useTheme } from "@/components/theme/ThemeProvider";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { toast } from "sonner";

// ============================================================
// TYPES
// ============================================================

interface DonationFormProps {
  streamer: StreamerProfile;
  onLoginClick?: () => void;
}

type DonationStatus = "idle" | "signing" | "confirming" | "success" | "error";

// Amount presets in USDC
const AMOUNT_PRESETS = [1, 5, 10];

// Animation Variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

const buttonVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: "easeOut" },
  },
  tap: { scale: 0.95 },
  hover: { scale: 1.02 },
};

const successVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.175, 0.885, 0.32, 1.275], // Bounce effect
    },
  },
};

import { useZkLogin } from "@/hooks/useZkLogin";
import { useUsdcBalance } from "@/hooks/useUsdcBalance";
import { useSuiNSName } from "@/hooks/useSuiNSName";


export function DonationForm({ streamer, onLoginClick }: DonationFormProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const currentAccount = useCurrentAccount();
  const { isAuthenticated: isZkAuthenticated, userAddress: zkAddress } =
    useZkLogin();

  // Unified Auth State
  const isConnected = !!currentAccount || isZkAuthenticated;
  const userAddress = currentAccount?.address || zkAddress;

  const { balance: usdcBalance, isLoading: isBalanceLoading } =
    useUsdcBalance(userAddress);

  const { name: streamerSuiNS } = useSuiNSName(streamer.wallet_address);
  // Form State
  const [amount, setAmount] = useState<number>(1);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [isCustom, setIsCustom] = useState(false);
  const [donorName, setDonorName] = useState("");
  const [message, setMessage] = useState("");

  // Transaction State
  const [status, setStatus] = useState<DonationStatus>("idle");
  const [txDigest, setTxDigest] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { donate, isLoading: isWalletLoading } = useDonate({
    streamerAddress: streamer.wallet_address,
    streamerId: streamer.id,
  });

  const { donateUSDC, isLoading: isZkLoading } = useZkDonation({
    streamerAddress: streamer.wallet_address,
    streamerId: streamer.id,
  });

  const isLoading = isWalletLoading || isZkLoading;

  // Get the actual amount (preset or custom)
  const getAmount = (): number => {
    if (isCustom && customAmount) {
      const parsed = parseFloat(customAmount);
      return isNaN(parsed) ? 0 : parsed;
    }
    return amount;
  };

  // Handle preset button click
  const handlePresetClick = (preset: number) => {
    setAmount(preset);
    setIsCustom(false);
    setCustomAmount("");
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const donationAmount = getAmount();
    if (donationAmount < 0.5) {
      setErrorMessage("Minimum donation is $0.50 USDC");
      return;
    }

    if (!isConnected) {
      // Should handle connection request if not connected, but UI hides submit button
      return;
    }

    // Proceed with wallet donation
    setStatus("signing");
    setErrorMessage(null);

    try {
      let digest: string;

      if (isZkAuthenticated) {
        // Use ZkLogin Donation Flow
        digest = await donateUSDC({
          amountUsdc: donationAmount,
          donorName: donorName || "Anonim",
          message,
        });
      } else {
        // Use Wallet Donation Flow
        digest = await donate({
          amountUsdc: donationAmount,
          donorName: donorName || "Anonim",
          message,
        });
      }

      setStatus("confirming");
      setTxDigest(digest);

      // Calculate net amount (95% to streamer, 5% fee)
      // This ensures the database reflects what the streamer actually received
      const netAmount = donationAmount * 0.95;

      // Save to Supabase
      await saveDonation({
        streamer_id: streamer.id,
        donor_name: donorName || "Anonim",
        message,
        amount_net: netAmount,
        tx_digest: digest,
      });

      setStatus("success");

      // Show success toast
      toast.success("Donation Sent! 🎉", {
        description: `Thank you for supporting ${streamer.display_name}!`,
      });

      // Reset form after success
      setTimeout(() => {
        setAmount(1);
        setCustomAmount("");
        setIsCustom(false);
        setDonorName("");
        setMessage("");
        setStatus("idle");
        setTxDigest(null);
      }, 5000);
    } catch (err) {
      console.error("Donation failed:", err);
      setStatus("error");
      const errMsg = err instanceof Error ? err.message : "Transaction failed";
      setErrorMessage(errMsg);

      // Show error toast
      toast.error("Donation Failed", {
        description: errMsg,
      });
    }
  };

  // Success state with animation
  if (status === "success") {
    return (
      <motion.div
        className="flex flex-col items-center justify-center py-10 space-y-4"
        variants={successVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          <CheckCircle className="w-16 h-16 text-green-500" />
        </motion.div>
        <motion.h3
          className={`text-xl font-bold ${isDark ? "text-white" : "text-black"}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Donation Sent! 🎉
        </motion.h3>
        <motion.p
          className={`text-sm text-center ${isDark ? "text-white/60" : "text-black/60"}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Thank you for supporting {streamer.display_name}!
        </motion.p>
        {txDigest && (
          <motion.a
            href={`https://suiscan.xyz/testnet/tx/${txDigest}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-500 hover:underline"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            View Transaction →
          </motion.a>
        )}
      </motion.div>
    );
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="flex flex-col h-full"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 no-scrollbar">
        {/* Streamer Profile Header */}
        <motion.div className="text-center pt-8 pb-6" variants={itemVariants}>
          <h1
            className={`text-2xl font-bold ${isDark ? "text-white" : "text-black"}`}
          >
            {streamer.display_name}
          </h1>
          <p
            className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"} mt-1`}
          >
            @{streamer.username}
          </p>
          {streamerSuiNS && (
            <p
              className={`text-xs ${isDark ? "text-blue-400" : "text-blue-600"} mt-0.5`}
            >
              {streamerSuiNS}
            </p>
          )}
        </motion.div>

        <motion.div className="mb-6 text-center" variants={itemVariants}>
          <p
            className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}
          >
            Support {streamer.display_name} with USDC on Sui Network
          </p>
        </motion.div>

        {/* Amount Selection - Card Design */}
        <motion.div variants={itemVariants}>
          {/* Amount Display Card - Editable */}
          <div
            className={`rounded-2xl p-6 mb-4 ${
              isDark ? "bg-zinc-900" : "bg-gray-50"
            }`}
          >
            <p
              className={`text-xs font-medium tracking-widest text-center mb-4 ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
            >
              DONATION AMOUNT
            </p>

            {/* Editable Amount Display */}
            <div className="text-center">
              <div className="relative inline-block">
                <input
                  type="text"
                  inputMode="decimal"
                  value={isCustom ? customAmount : amount.toString()}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^\d*\.?\d*$/.test(value)) {
                      setCustomAmount(value);
                      setIsCustom(true);
                    }
                  }}
                  onFocus={() => {
                    if (!isCustom) {
                      setCustomAmount(amount.toString());
                      setIsCustom(true);
                    }
                  }}
                  placeholder="0"
                  className={`text-5xl font-black tracking-tight text-center bg-transparent outline-none w-full max-w-[200px] ${
                    isDark
                      ? "text-white placeholder:text-white/30"
                      : "text-black placeholder:text-black/30"
                  }`}
                  style={{ caretColor: isDark ? "white" : "black" }}
                />
              </div>
              <p
                className={`text-sm font-bold mt-2 ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              >
                USDC
              </p>
            </div>

            {/* Minimum Amount Note */}
            <p
              className={`text-xs text-center mt-3 ${isDark ? "text-gray-500" : "text-gray-400"}`}
            >
              Minimum: $0.50
            </p>
          </div>

          {/* Quick Amount Presets */}
          <div className="grid grid-cols-3 gap-2">
            {AMOUNT_PRESETS.map((preset) => (
              <motion.button
                key={preset}
                type="button"
                onClick={() => handlePresetClick(preset)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`py-3 rounded-lg text-sm font-medium transition-all ${
                  !isCustom && amount === preset
                    ? isDark
                      ? "bg-white text-black"
                      : "bg-black text-white"
                    : isDark
                      ? "bg-zinc-800 text-white hover:bg-zinc-700"
                      : "bg-gray-100 text-black hover:bg-gray-200"
                }`}
              >
                ${preset}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Donor Name */}
        <motion.div className="space-y-2 mt-6" variants={itemVariants}>
          <label
            className={`text-sm font-medium ${isDark ? "text-white/80" : "text-black/80"}`}
          >
            Your Name (Optional)
          </label>
          <input
            type="text"
            placeholder="Anonim"
            value={donorName}
            onChange={(e) => setDonorName(e.target.value)}
            maxLength={50}
            className={`w-full px-4 py-3 rounded-lg text-sm border transition-all ${
              isDark
                ? "border-white/20 bg-white/5 text-white placeholder:text-white/30"
                : "border-black/20 bg-black/5 text-black placeholder:text-black/30"
            }`}
          />
        </motion.div>

        {/* Message */}
        <motion.div className="space-y-2 mt-6" variants={itemVariants}>
          <label
            className={`text-sm font-medium ${isDark ? "text-white/80" : "text-black/80"}`}
          >
            Message
          </label>
          <textarea
            placeholder="Say something nice..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={200}
            rows={3}
            className={`w-full px-4 py-3 rounded-lg text-sm border resize-none transition-all ${
              isDark
                ? "border-white/20 bg-white/5 text-white placeholder:text-white/30"
                : "border-black/20 bg-black/5 text-black placeholder:text-black/30"
            }`}
          />
          <p
            className={`text-xs text-right ${isDark ? "text-white/40" : "text-black/40"}`}
          >
            {message.length}/200
          </p>
        </motion.div>

        {/* Error Message */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 mt-4"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-500">{errorMessage}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Fixed Footer Action Area */}
      <div
        className={`flex-none p-4 pb-6 z-10 border-t ${
          isDark ? "bg-zinc-950 border-white/10" : "bg-white border-black/5"
        }`}
      >
        <motion.div variants={itemVariants}>
          {!isConnected ? (
            <div className="w-full">
              <button
                onClick={() => {
                  if (onLoginClick) onLoginClick();
                }}
                type="button"
                className={`w-full h-14 rounded-lg font-[family-name:var(--font-pixel)] font-bold text-xs tracking-widest uppercase transition-colors flex items-center justify-center gap-2 ${
                  isDark
                    ? "bg-white text-black hover:bg-zinc-200"
                    : "bg-black text-white hover:bg-zinc-800"
                }`}
              >
                CONNECT TO DONATE
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Gas Sponsorship Badge */}
              <div className="flex justify-between items-center">
                <div
                  className={`text-center text-xs mb-2 ${isDark ? "text-gray-400" : "text-gray-500"}`}
                >
                  Balance:{" "}
                  <span
                    className={
                      isDark
                        ? "text-white font-medium"
                        : "text-black font-medium"
                    }
                  >
                    {isBalanceLoading ? "..." : `$${usdcBalance.toFixed(2)}`}{" "}
                    USDC
                  </span>
                </div>
                <div className="flex items-center justify-center gap-1.5 opacity-70">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <p
                    className={`text-[10px] uppercase tracking-wider font-bold ${
                      isDark ? "text-green-400" : "text-green-600"
                    }`}
                  >
                    Gas Fee Sponsored
                  </p>
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={
                  isLoading || status === "signing" || status === "confirming"
                }
                variants={buttonVariants}
                whileHover={!isLoading ? "hover" : undefined}
                whileTap={!isLoading ? "tap" : undefined}
                className={`w-full py-4 rounded-lg font-[family-name:var(--font-pixel)] text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  isDark
                    ? "bg-white text-black hover:bg-zinc-200"
                    : "bg-black text-white hover:bg-zinc-800"
                }`}
              >
                {status === "signing" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Waiting for signature...
                  </>
                ) : status === "confirming" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Confirming...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Sawer ${getAmount().toFixed(2)}
                  </>
                )}
              </motion.button>
            </div>
          )}
        </motion.div>
      </div>
    </motion.form>
  );
}
