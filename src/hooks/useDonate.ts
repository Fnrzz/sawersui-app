"use client";

import { useState, useCallback } from "react";
import { Transaction } from "@mysten/sui/transactions";
import { fromBase64 } from "@mysten/sui/utils";
import {
  useSuiClient,
  useCurrentAccount,
  useSignTransaction,
} from "@mysten/dapp-kit";
import { CONFIG } from "@/lib/config";
// Removed unused sponsor actions imports

// ============================================================
// TYPES
// ============================================================

interface UseDonateParams {
  streamerAddress: string;
  streamerId: string;
}

interface DonateParams {
  amount: number; // Renamed from amountUsdc to be generic
  coinType: "USDC" | "SUI";
  donorName: string;
  message: string;
}

interface UseDonateResult {
  donate: (params: DonateParams) => Promise<string>;
  isLoading: boolean;
  error: string | null;
}

// ============================================================
// CONSTANTS
// ============================================================

const USDC_DECIMALS = 6;
const SUI_DECIMALS = 9;
const USDC_TYPE = CONFIG.SUI.ADDRESS.USDC_TYPE;
const SUI_TYPE = "0x2::sui::SUI";

export function useDonate({
  streamerAddress,
  //   streamerId, // Unused
}: UseDonateParams): UseDonateResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signTransaction } = useSignTransaction();

  const donate = useCallback(
    async (params: DonateParams): Promise<string> => {
      const { amount, coinType, donorName, message } = params;

      if (!currentAccount?.address) {
        throw new Error("Wallet not connected");
      }

      if (amount <= 0) {
        throw new Error("Amount must be greater than 0");
      }

      setIsLoading(true);
      setError(null);

      try {
        const decimals = coinType === "SUI" ? SUI_DECIMALS : USDC_DECIMALS;
        const targetCoinType = coinType === "SUI" ? SUI_TYPE : USDC_TYPE;
        const amountMist = BigInt(Math.floor(amount * 10 ** decimals));

        // Step 1: Client-side Balance Check
        const { data: coins } = await suiClient.getCoins({
          owner: currentAccount.address,
          coinType: targetCoinType,
        });

        if (!coins || coins.length === 0) {
          throw new Error(`No ${coinType} coins found in wallet`);
        }

        const totalBalance = coins.reduce(
          (sum, coin) => sum + BigInt(coin.balance),
          BigInt(0),
        );

        if (totalBalance < amountMist) {
          const required = Number(amountMist) / 10 ** decimals;
          const available = Number(totalBalance) / 10 ** decimals;
          throw new Error(
            `Insufficient ${coinType} balance. Required: ${required}, Available: ${available.toFixed(2)}`,
          );
        }

        // ---------------------------------------------------------
        // SPONSORED TRANSACTION
        // ---------------------------------------------------------
        try {
          const payload = {
            sender: currentAccount.address,
            streamerAddress,
            amountMist: amountMist.toString(),
            coinType: targetCoinType,
            // Meta info (optional, but good for tracking if backend logs it)
            donorName,
            message,
          };

          const response = await fetch("/api/sponsor", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            const errData = await response.json();
            throw new Error(
              errData.error || "Server failed to sponsor transaction",
            );
          }

          const { sponsoredTransactionBytes, sponsorSignature } =
            await response.json();

          // Deserialize to Transaction object
          const txObject = Transaction.from(
            fromBase64(sponsoredTransactionBytes),
          );

          // Sign with User Wallet
          const { signature: userSignature } = await signTransaction({
            transaction: txObject,
            account: currentAccount,
            chain: "sui:testnet", // Ensure chain match
          });

          // Execute with both signatures
          const result = await suiClient.executeTransactionBlock({
            transactionBlock: fromBase64(sponsoredTransactionBytes),
            signature: [userSignature, sponsorSignature],
            requestType: "WaitForLocalExecution",
            options: {
              showEffects: true,
              showEvents: true,
              showBalanceChanges: true, // Helpful for verification
            },
          });

          if (result.effects?.status.status !== "success") {
            throw new Error(
              `Transaction failed on-chain: ${result.effects?.status.error || "Unknown error"}`,
            );
          }

          return result.digest;
        } catch (sponsorErr) {
          console.error("[Donate] Sponsorship attempt failed:", sponsorErr);
          throw sponsorErr;
        }
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "Transaction failed";
        // setError(errorMessage); // Don't set error state here, let UI handle it via promise rejection or set it if UI relies on it.
        // Actually adhering to existing pattern:
        setError(errorMessage);
        console.error("[Donate Error]", err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [currentAccount, suiClient, signTransaction, streamerAddress],
  );

  return {
    donate,
    isLoading,
    error,
  };
}
