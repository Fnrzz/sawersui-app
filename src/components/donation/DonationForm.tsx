import { useState } from "react";
import { useCurrentAccount, useDisconnectWallet } from "@mysten/dapp-kit";
import { useTranslations } from "next-intl";
import {
  Loader2,
  Send,
  CheckCircle,
  AlertCircle,
  Heart,
  Check,
  LogOut,
  Wallet,
} from "lucide-react";
import { useDonate } from "@/hooks/useDonate";
import { useZkDonation } from "@/hooks/useZkDonation";
import { saveDonation, StreamerProfile } from "@/lib/actions/donation";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { toast } from "sonner";
import { useZkLogin } from "@/hooks/useZkLogin";
import { useUsdcBalance } from "@/hooks/useUsdcBalance";
import { signOut } from "@/lib/actions/auth";

interface DonationFormProps {
  streamer: StreamerProfile;
  onLoginClick?: () => void;
}

type DonationStatus = "idle" | "signing" | "confirming" | "success" | "error";

const AMOUNT_PRESETS = [1, 5, 10, 25, 50, 100];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.08 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: "easeOut" },
  },
};

export function DonationForm({ streamer, onLoginClick }: DonationFormProps) {
  const t = useTranslations("DonationForm");
  const currentAccount = useCurrentAccount();
  const { mutate: disconnect } = useDisconnectWallet();
  const {
    isAuthenticated: isZkAuthenticated,
    userAddress: zkAddress,
    logout: zkLogout,
  } = useZkLogin();

  const isConnected = !!currentAccount || isZkAuthenticated;
  const userAddress = currentAccount?.address || zkAddress;

  const { balance: usdcBalance, isLoading: isBalanceLoading } =
    useUsdcBalance(userAddress);

  const [amount, setAmount] = useState<number>(5);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [isCustom, setIsCustom] = useState(false);
  const [donorName, setDonorName] = useState("");
  const [message, setMessage] = useState("");

  // Checkbox States
  const [isAgeChecked, setIsAgeChecked] = useState(false);
  const [isAgreedChecked, setIsAgreedChecked] = useState(false);

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

  const handleLogout = async () => {
    if (currentAccount) {
      disconnect();
    } else if (isZkAuthenticated) {
      await zkLogout();
    }
    await signOut();
    window.location.reload();
  };

  const getAmount = (): number => {
    if (isCustom && customAmount) {
      const parsed = parseFloat(customAmount);
      return isNaN(parsed) ? 0 : parsed;
    }
    return amount;
  };

  const handlePresetClick = (preset: number) => {
    setAmount(preset);
    setIsCustom(false);
    setCustomAmount("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAgeChecked || !isAgreedChecked) {
      setErrorMessage(t("agreementError"));
      return;
    }

    const donationAmount = getAmount();
    if (donationAmount < 0.5) {
      setErrorMessage(t("minDonation"));
      return;
    }

    if (!isConnected) return;

    setStatus("signing");
    setErrorMessage(null);

    try {
      let digest: string;

      if (isZkAuthenticated) {
        digest = await donateUSDC({
          amountUsdc: donationAmount,
          donorName: donorName || "Anonim",
          message,
        });
      } else {
        digest = await donate({
          amountUsdc: donationAmount,
          donorName: donorName || "Anonim",
          message,
        });
      }

      setStatus("confirming");
      setTxDigest(digest);

      const netAmount = donationAmount * 0.95;

      await saveDonation({
        streamer_id: streamer.id,
        donor_name: donorName || "Anonim",
        message,
        amount_net: netAmount,
        tx_digest: digest,
      });

      setStatus("success");

      toast.success(t("successTitle"), {
        description: t("successDesc", { name: streamer.display_name }),
      });

      setTimeout(() => {
        setAmount(5);
        setCustomAmount("");
        setIsCustom(false);
        setDonorName("");
        setMessage("");
        setStatus("idle");
        setTxDigest(null);
        // Do not reset checkboxes to force re-read? Or reset them?
        // Typically better to leave them or reset. I'll reset them.
        setIsAgeChecked(false);
        setIsAgreedChecked(false);
      }, 5000);
    } catch (err) {
      console.error("Donation failed:", err);
      setStatus("error");
      const errMsg = err instanceof Error ? err.message : "Transaction gagal";
      setErrorMessage(errMsg);
      toast.error("Donasi Gagal", { description: errMsg });
    }
  };

  // Success State
  if (status === "success") {
    return (
      <motion.div
        className="flex flex-col items-center justify-center py-12 space-y-4"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          <CheckCircle className="w-16 h-16 text-green-500" />
        </motion.div>
        <h3 className="text-xl font-bold text-foreground">
          {t("successTitle")}
        </h3>
        <p className="text-sm text-muted-foreground text-center">
          {t("successDesc", { name: streamer.display_name })}
        </p>
        {txDigest && (
          <a
            href={`https://suiscan.xyz/testnet/tx/${txDigest}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline font-medium"
          >
            {t("viewTransaction") || "View Transaction"} →
          </a>
        )}
      </motion.div>
    );
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="flex flex-col"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Auth Status Header */}
      {isConnected && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6 bg-gray-50 p-3 rounded-lg border-2 border-black/10"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
              <Wallet className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-black/50 leading-none">
                {t("balance")}
              </span>
              <span className="text-sm font-black text-black leading-tight">
                {isBalanceLoading ? "..." : `$${usdcBalance.toFixed(2)}`}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="p-2 hover:bg-red-100 rounded-md transition-colors group"
            title={t("logout") || "Logout"}
          >
            <LogOut className="w-4 h-4 text-black/40 group-hover:text-red-500" />
          </button>
        </motion.div>
      )}

      {/* Jumlah */}
      <motion.div variants={itemVariants} className="mb-6">
        <label className="text-sm font-bold text-black mb-1 block">
          {t("nominal")} <span className="text-red-500">*</span>
        </label>

        {/* Underlined Input with Prefix */}
        <div className="relative mb-4">
          <span className="absolute left-0 top-1/2 -translate-y-1/2 text-black font-bold text-lg">
            $
          </span>
          <input
            type="text"
            inputMode="decimal"
            value={isCustom ? customAmount : ""}
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
            placeholder={t("placeholderAmount")}
            className="w-full pl-8 py-2 text-lg font-bold bg-transparent border-b-[3px] border-black text-black placeholder:text-black/30 focus:outline-none focus:border-black/60 rounded-none transition-all"
          />
        </div>

        {/* Quick Presets - Colored Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-1">
          {AMOUNT_PRESETS.slice(0, 4).map((preset, idx) => {
            // Cyclical colors: Teal, Blue, Orange, Purple
            const colors = [
              "bg-[#99F6E4]", // Teal
              "bg-[#3B82F6]", // Blue
              "bg-[#F59E0B]", // Orange
              "bg-[#A78BFA]", // Purple
            ];
            const colorClass = colors[idx % colors.length];

            return (
              <button
                key={preset}
                type="button"
                onClick={() => handlePresetClick(preset)}
                className={`py-3 rounded-lg text-sm font-black border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-y-1 hover:shadow-none active:translate-y-1 active:shadow-none ${colorClass} text-black`}
              >
                ${preset}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Nama */}
      <motion.div className="mb-6" variants={itemVariants}>
        <label className="text-sm font-bold text-black mb-1 block">
          {t("from")} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          placeholder={t("placeholderName")}
          value={donorName}
          onChange={(e) => setDonorName(e.target.value)}
          maxLength={50}
          className="w-full py-2 text-lg font-bold bg-transparent border-b-[3px] border-black text-black placeholder:text-black/30 focus:outline-none focus:border-black/60 rounded-none transition-all px-0"
        />
      </motion.div>

      {/* Email (Visual Only for now to match ref, or map to contact field if exists, otherwise skip or make decorative) */}
      {/* Skipping Email to keep logic simple, adding Pesan */}

      {/* Pesan */}
      <motion.div className="mb-8" variants={itemVariants}>
        <label className="text-sm font-bold text-black mb-1 block">
          {t("message")} <span className="text-red-500">*</span>
        </label>
        <textarea
          placeholder={t("placeholderMessage")}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={200}
          rows={1}
          className="w-full py-2 text-lg font-bold bg-transparent border-b-[3px] border-black text-black placeholder:text-black/30 resize-none focus:outline-none focus:border-black/60 rounded-none transition-all px-0 min-h-[40px]"
        />
      </motion.div>

      {/* Checkboxes */}
      <div className="space-y-3 mb-8">
        <div
          className="flex items-start gap-3 cursor-pointer group"
          onClick={() => setIsAgeChecked(!isAgeChecked)}
        >
          <div
            className={`w-6 h-6 border-[3px] border-black flex-shrink-0 flex items-center justify-center transition-colors ${isAgeChecked ? "bg-black" : "bg-transparent group-hover:bg-black/5"}`}
          >
            {isAgeChecked && (
              <Check className="w-4 h-4 text-white stroke-[4]" />
            )}
          </div>
          <p className="text-xs font-bold text-black/80 leading-tight pt-1 select-none">
            {t("ageCheck")}
          </p>
        </div>
        <div
          className="flex items-start gap-3 cursor-pointer group"
          onClick={() => setIsAgreedChecked(!isAgreedChecked)}
        >
          <div
            className={`w-6 h-6 border-[3px] border-black flex-shrink-0 flex items-center justify-center transition-colors ${isAgreedChecked ? "bg-black" : "bg-transparent group-hover:bg-black/5"}`}
          >
            {isAgreedChecked && (
              <Check className="w-4 h-4 text-white stroke-[4]" />
            )}
          </div>
          <p className="text-xs font-bold text-black/80 leading-tight pt-1 select-none">
            {t("agreedCheck")}
          </p>
        </div>
      </div>

      {/* Error */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            className="flex items-center gap-2 p-3 rounded-lg bg-red-100 border-2 border-black mb-4 font-bold"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-600">{errorMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CTA Area - Split Layout */}
      <motion.div
        className="flex flex-col md:flex-row items-stretch justify-between gap-4 -mx-6 -mb-6 p-6 md:-mx-8 md:-mb-8 md:p-6 border-t-[3px] border-black rounded-b-lg"
        variants={itemVariants}
      >
        <div className="flex flex-col justify-center mb-2 md:mb-0">
          <p className="text-sm font-bold text-black">
            {t("supportAmount")} ${getAmount()}
          </p>
          <p className="text-xs text-black/60">{t("fee")}</p>
          <p className="text-3xl font-black text-black mt-1">
            {t("total")} ${getAmount()} USDC
          </p>
        </div>

        {!isConnected ? (
          <button
            onClick={() => onLoginClick?.()}
            type="button"
            className="w-full md:flex-1 md:max-w-[200px] py-4 rounded-lg font-black text-lg bg-[#F59E0B] text-black border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-y-1 hover:shadow-none flex items-center justify-center text-center leading-tight"
          >
            {t("loginButton")}
          </button>
        ) : (
          <button
            type="submit"
            disabled={
              isLoading ||
              status === "signing" ||
              status === "confirming" ||
              !isAgeChecked ||
              !isAgreedChecked
            }
            className="w-full md:flex-1 md:max-w-[200px] py-4 rounded-lg font-black text-md bg-[#F59E0B] text-black border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-y-1 hover:shadow-none flex items-center justify-center text-center leading-tight disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none disabled:translate-y-1 disabled:bg-gray-400"
          >
            {status === "signing" ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : status === "confirming" ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              t("submitButton")
            )}
          </button>
        )}
      </motion.div>

      {/* Powered By */}
      <motion.p
        variants={itemVariants}
        className="text-center text-xs text-muted-foreground/60 mt-6 pt-4"
      >
        {t.rich("poweredBy", {
          brand: (chunks) => (
            <span className="text-primary font-medium">{chunks}</span>
          ),
        })}
      </motion.p>
    </motion.form>
  );
}
