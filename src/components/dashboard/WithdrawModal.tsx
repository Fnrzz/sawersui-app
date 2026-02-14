"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useWithdraw } from "@/hooks/useWithdraw";

interface WithdrawModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usdcBalance: string;
  suiBalance: string;
}

export function WithdrawModal({
  open,
  onOpenChange,
  usdcBalance,
  suiBalance,
}: WithdrawModalProps) {
  const t = useTranslations("Dashboard");
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [coinType, setCoinType] = useState<"USDC" | "SUI">("USDC");
  const [isLoading, setIsLoading] = useState(false);
  const { withdraw } = useWithdraw();

  const handleWithdraw = async () => {
    try {
      setIsLoading(true);
      const val = parseFloat(amount);
      const minAmount = coinType === "SUI" ? 0.1 : 0.5;

      if (isNaN(val) || val < minAmount) {
        toast.error(
          t("withdraw.minAmountError", { amount: minAmount, coin: coinType }),
        );
        setIsLoading(false);
        return;
      }
      if (!recipient.startsWith("0x") || recipient.length < 50) {
        toast.error(t("withdraw.invalidAddress"));
        setIsLoading(false);
        return;
      }

      await withdraw({ amount: val, recipientAddress: recipient, coinType });
      toast.success(t("withdraw.success"));
      onOpenChange(false);
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

  const handleMaxClick = () => {
    if (coinType === "USDC") {
      setAmount(usdcBalance);
    } else {
      // For SUI, we might want to subtract gas? NO, it's sponsored.
      // But we should leave dust? Sponsored tx doesn't use user balance for gas.
      // So detailed behavior: user pays split amount. Gas paid by sponsor.
      // Theoretically can withdraw max.
      setAmount(suiBalance);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full border-[3px] border-[#2a2a2a] shadow-[4px_4px_0px_0px_#2a2a2a] rounded-xl p-0 overflow-hidden bg-white gap-0">
        {/* Header */}
        <div className="p-6 border-b-[3px] border-[#2a2a2a] bg-[#FEFCE8]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-black">
              {t("withdraw.title")}
            </DialogTitle>
            <DialogDescription className="text-black/60 font-medium">
              {t("withdraw.desc")}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-6">
          {/* Coin Selector */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-black uppercase tracking-wider">
              {t("withdraw.coinType")}
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCoinType("USDC")}
                className={`flex-1 py-2 font-bold border-2 border-black transition-all
                    ${
                      coinType === "USDC"
                        ? "bg-black text-white"
                        : "bg-white text-black hover:bg-gray-100"
                    }
                  `}
              >
                USDC
              </button>
              <button
                type="button"
                onClick={() => setCoinType("SUI")}
                className={`flex-1 py-2 font-bold border-2 border-black transition-all
                    ${
                      coinType === "SUI"
                        ? "bg-black text-white"
                        : "bg-white text-black hover:bg-gray-100"
                    }
                  `}
              >
                SUI
              </button>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-black uppercase tracking-wider">
              {t("withdraw.amount")} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-0 top-1/2 -translate-y-1/2 text-black font-bold text-lg">
                {coinType === "USDC" ? "$" : "SUI"}
              </span>
              <input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-10 pr-16 py-2 text-lg font-bold bg-transparent border-b-[3px] border-black text-black placeholder:text-black/30 focus:outline-none focus:border-black/60 rounded-none transition-all"
              />
              <button
                type="button"
                onClick={handleMaxClick}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-xs font-black bg-black text-white px-2 py-1 rounded hover:opacity-80 transition-opacity"
              >
                MAX
              </button>
            </div>
            <p className="text-xs text-black/50 font-medium text-right">
              {t("withdraw.balance", {
                amount: coinType === "USDC" ? usdcBalance : suiBalance,
                coin: coinType === "USDC" ? "$" : "SUI",
              })}
            </p>
          </div>

          {/* Recipient Input */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-black uppercase tracking-wider">
              {t("withdraw.recipient")} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="0x..."
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full py-2 text-sm font-bold bg-transparent border-b-[3px] border-black text-black placeholder:text-black/30 focus:outline-none focus:border-black/60 rounded-none transition-all"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex gap-3">
            <button
              onClick={() => onOpenChange(false)}
              className="flex-1 py-3 rounded-lg font-bold text-sm border-[3px] border-black text-black hover:bg-gray-100 transition-colors"
            >
              {t("withdraw.cancel")}
            </button>
            <button
              onClick={handleWithdraw}
              disabled={isLoading}
              className="flex-1 py-3 rounded-lg font-black text-sm bg-[#F59E0B] text-black border-[3px] border-black shadow-[4px_4px_0px_0px_#2a2a2a] hover:translate-y-1 hover:shadow-none active:translate-y-1 active:shadow-none transition-all flex justify-center items-center disabled:opacity-50 disabled:pointer-events-none"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                t("menu.balance.action")
              )}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
