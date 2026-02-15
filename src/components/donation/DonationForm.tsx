import { useState, useRef } from "react";
import { useCurrentAccount, useDisconnectWallet } from "@mysten/dapp-kit";
import { useTranslations } from "next-intl";
import { OverlaySettings } from "@/lib/overlay-settings";
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  Check,
  LogOut,
  Wallet,
  Play,
  Square,
} from "lucide-react";

import { useDonate } from "@/hooks/useDonate";
import { useZkDonation } from "@/hooks/useZkDonation";
import { saveDonation, StreamerProfile } from "@/lib/actions/donation";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { toast } from "sonner";
import { useZkLogin } from "@/hooks/useZkLogin";
import { useBalances } from "@/hooks/useBalances";
import { signOut } from "@/lib/actions/auth";

interface DonationFormProps {
  streamer: StreamerProfile;
  settings: OverlaySettings;
  onLoginClick?: () => void;
}

type DonationStatus = "idle" | "signing" | "confirming" | "success" | "error";

const AMOUNT_PRESETS_USDC = [1, 5, 10, 25, 50, 100];
const AMOUNT_PRESETS_SUI = [1, 5, 10, 20, 50, 100];

const VOICE_OPTIONS = [
  { id: "kore", label: "Kore" },
  { id: "charon", label: "Charon" },
  { id: "puck", label: "Puck" },
  { id: "zephyr", label: "Zephyr" },
];

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

export function DonationForm({
  streamer,
  settings,
  onLoginClick,
}: DonationFormProps) {
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

  const { balances, isLoading: isBalanceLoading } = useBalances(userAddress);

  const [coinType, setCoinType] = useState<"USDC" | "SUI">("USDC");
  const [amount, setAmount] = useState<number>(5);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [isCustom, setIsCustom] = useState(false);
  const [donorName, setDonorName] = useState("");
  const [message, setMessage] = useState("");
  const [ttsVoice, setTtsVoice] = useState<string>("kore");

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

  const { donate: zkDonate, isLoading: isZkLoading } = useZkDonation({
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

  const currentBalance = coinType === "USDC" ? balances.usdc : balances.sui;

  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const isTtsAllowed =
    settings.is_tts_enabled && getAmount() >= settings.tts_min_amount;

  const playVoicePreview = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    const audioPath = `/sound-tts/${ttsVoice}.wav`;
    const audio = new Audio(audioPath);

    audio.onended = () => {
      setIsPlaying(false);
    };

    audioRef.current = audio;
    setIsPlaying(true);
    audio.play().catch((err) => {
      console.error("Failed to play audio:", err);
      setIsPlaying(false);
      toast.error("Gagal memutar preview suara");
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAgeChecked || !isAgreedChecked) {
      setErrorMessage(t("agreementError"));
      return;
    }

    const donationAmount = getAmount();
    const minAmount = coinType === "SUI" ? 0.1 : 0.5;

    if (donationAmount < minAmount) {
      setErrorMessage(
        t("minDonationError", { amount: minAmount, coin: coinType }),
      );
      return;
    }

    if (!isConnected) return;

    setStatus("signing");
    setErrorMessage(null);

    try {
      let digest: string;

      if (isZkAuthenticated) {
        digest = await zkDonate({
          amount: donationAmount,
          coinType,
          donorName: donorName || "Anonim",
          message,
        });
      } else {
        digest = await donate({
          amount: donationAmount,
          coinType,
          donorName: donorName || "Anonim",
          message,
        });
      }

      setStatus("confirming");
      setTxDigest(digest);

      // Save donation logic is handled server-side mostly, but we call saveDonation to index it basically
      // The amount_net calculation here is just for optimistic UI or backend record, actual net is on chain
      // SUI has no fee deduction logic on client side here shown, but let's just save raw amount for now or keeping 0.95 factor?
      // Assuming 100% sponsored, net = gross for user?
      // Wait, 100% sponsored means user doesn't pay GAS. Platform fee might still exist.
      // previous code: const netAmount = donationAmount * 0.95;
      // Let's keep it consistent.
      const netAmount = donationAmount * 0.95;

      await saveDonation({
        streamer_id: streamer.id,
        donor_name: donorName || "Anonim",
        message,
        amount_net: netAmount,
        tx_digest: digest,
        // coin_type is determined by server from tx, so we don't strictly need to pass it if saveDonation verifies tx
        // but verifyDonationAmount extracts it.
        tts_voice: isTtsAllowed ? ttsVoice : undefined,
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
        setDonorName("");
        setMessage("");
        setTtsVoice("female");
        setStatus("idle");
        setTxDigest(null);
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

  const activePresets =
    coinType === "USDC" ? AMOUNT_PRESETS_USDC : AMOUNT_PRESETS_SUI;

  // ... (Success State is same, omitting for brevity in replacement if possible, but safer to include full render)

  if (status === "success") {
    // ... same code ...
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
                {isBalanceLoading
                  ? "..."
                  : `${currentBalance.toFixed(coinType === "USDC" ? 2 : 4)} ${coinType}`}
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

      {/* Coin Selector */}
      <motion.div variants={itemVariants} className="mb-6">
        <label className="text-sm font-bold text-black mb-1 block">
          {t("selectCoin")}
        </label>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => {
              setCoinType("USDC");
              // Reset custom amount checks or presets if needed?
              // Just keep amount, user can adjust.
            }}
            className={`flex-1 py-3 px-4 rounded-lg font-bold border-2 border-black transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2
              ${
                coinType === "USDC"
                  ? "bg-blue-100 text-black"
                  : "bg-white text-black hover:bg-gray-50"
              }
            `}
          >
            <span className="bg-blue-500 w-3 h-3 rounded-full border border-black"></span>
            USDC
          </button>
          <button
            type="button"
            onClick={() => setCoinType("SUI")}
            className={`flex-1 py-3 px-4 rounded-lg font-bold border-2 border-black transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2
              ${
                coinType === "SUI"
                  ? "bg-blue-100 text-black"
                  : "bg-white text-black hover:bg-gray-50"
              }
            `}
          >
            <span className="bg-blue-500 w-3 h-3 rounded-full border border-black"></span>
            SUI
          </button>
        </div>
      </motion.div>

      {/* Jumlah */}
      <motion.div variants={itemVariants} className="mb-6">
        <label className="text-sm font-bold text-black mb-1 block">
          {t("nominal")} <span className="text-red-500">*</span>
        </label>

        {/* Underlined Input with Prefix */}
        <div className="relative mb-4">
          <span className="absolute left-0 top-1/2 -translate-y-1/2 text-black font-bold text-lg">
            {coinType === "USDC" ? "$" : "SUI"}
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
            className="w-full pl-12 py-2 text-lg font-bold bg-transparent border-b-[3px] border-black text-black placeholder:text-black/30 focus:outline-none focus:border-black/60 rounded-none transition-all"
          />
        </div>

        {/* Quick Presets - Colored Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-1">
          {activePresets.slice(0, 4).map((preset, idx) => {
            // Cyclical colors
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
                {coinType === "USDC" ? "$" : ""}
                {preset} {coinType === "SUI" ? "SUI" : ""}
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

      {/* Voice Selector */}
      {settings.is_tts_enabled && (
        <motion.div className="mb-6" variants={itemVariants}>
          <label className="text-sm font-bold text-black mb-1 block">
            {t("voice") || "Suara (TTS)"}
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <select
                value={ttsVoice}
                onChange={(e) => setTtsVoice(e.target.value)}
                disabled={!isTtsAllowed}
                className="w-full appearance-none py-2 px-3 rounded-lg border-2 border-black font-bold text-sm bg-white disabled:opacity-50 disabled:bg-gray-100 transition-all focus:outline-none focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                {VOICE_OPTIONS.map((voice) => (
                  <option key={voice.id} value={voice.id}>
                    {voice.label}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg
                  className="w-4 h-4 text-black"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>

            <button
              type="button"
              onClick={playVoicePreview}
              disabled={!isTtsAllowed}
              className={`w-10 h-10 flex items-center justify-center rounded-lg border-2 border-black transition-all ${
                isPlaying
                  ? "bg-red-100 text-red-600 shadow-none translate-y-1"
                  : "bg-white text-black hover:bg-gray-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5"
              } disabled:opacity-50 disabled:bg-gray-100 disabled:shadow-none disabled:translate-y-0`}
            >
              {isPlaying ? (
                <Square className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current" />
              )}
            </button>
          </div>
          {!isTtsAllowed && (
            <p className="text-xs text-amber-600 font-bold mt-2 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Minimal donasi {settings.tts_min_amount} koin untuk fitur Suara.
            </p>
          )}
        </motion.div>
      )}

      {/* Pesan */}
      <motion.div className="mb-8" variants={itemVariants}>
        <label className="text-sm font-bold text-black mb-1 block">
          {t("message")} <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <textarea
            placeholder={t("placeholderMessage")}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={200}
            rows={1}
            className="w-full py-2 text-lg font-bold bg-transparent border-b-[3px] border-black text-black placeholder:text-black/30 resize-none focus:outline-none focus:border-black/60 rounded-none transition-all px-0 min-h-[40px]"
          />
          <div className="absolute right-0 bottom-2 text-[10px] font-bold text-black/40">
            {message.length}/200
          </div>
        </div>
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

      {/* CTA Area */}
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
            {t("total")} {getAmount()} {coinType}
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
        initial="hidden"
        animate="visible"
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
