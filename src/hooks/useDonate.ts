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
  amountUsdc: number;
  donorName: string;
  message: string;
}

interface UseDonateResult {
  donate: (params: DonateParams) => Promise<string>;
  isLoading: boolean;
  error: string | null;
}

interface Coin {
  coinType: string;
  coinObjectId: string;
  version: string;
  digest: string;
  balance: string;
  previousTransaction: string;
}

// ============================================================
// CONSTANTS
// ============================================================

const USDC_DECIMALS = 6;
const USDC_TYPE = CONFIG.SUI.ADDRESS.USDC_TYPE;
const PACKAGE_ID = CONFIG.SUI.ADDRESS.PACKAGE_ID;
const CONFIG_ID = CONFIG.SUI.ADDRESS.CONFIG_ID;

export function useDonate({ streamerAddress, streamerId }: UseDonateParams): UseDonateResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signTransaction } = useSignTransaction(); 




  const donate = useCallback(async (params: DonateParams): Promise<string> => {
    const { amountUsdc, donorName } = params;

    if (!currentAccount?.address) {
      throw new Error("Wallet not connected");
    }

    if (amountUsdc <= 0) {
      throw new Error("Amount must be greater than 0");
    }

    setIsLoading(true);
    setError(null);

    // Fetch coins once to reuse
    let coins;
    let amountMicro: bigint;


    try {
      amountMicro = BigInt(Math.floor(amountUsdc * 10 ** USDC_DECIMALS));

      // Step 1: Fetch user's USDC coins
      const { data } = await suiClient.getCoins({
        owner: currentAccount.address,
        coinType: USDC_TYPE,
      });
      coins = data;

      if (!coins || coins.length === 0) {
        throw new Error("No USDC coins found in wallet");
      }

      const totalBalance = coins.reduce(
        (sum, coin) => sum + BigInt(coin.balance),
        BigInt(0)
      );

      if (totalBalance < amountMicro) {
        const required = Number(amountMicro) / 10 ** USDC_DECIMALS;
        const available = Number(totalBalance) / 10 ** USDC_DECIMALS;
        throw new Error(
          `Insufficient USDC balance. Required: ${required}, Available: ${available.toFixed(2)}`
        );
      }

      // ---------------------------------------------------------
      // SPONSORED TRANSACTION
      // ---------------------------------------------------------
      try {
        const payload = {
             sender: currentAccount.address,
             streamerAddress,
             amountMist: amountMicro.toString()
        };

        const response = await fetch("/api/sponsor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
           const errData = await response.json();
           throw new Error(errData.error || "Server failed to sponsor transaction");
        }

        const { txBytes, sponsorSignature } = await response.json();

        // Sign with User Wallet
        // Ensure we are passing the correct object type expected by the wallet adapter
        // Passing the transaction object directly can cause Type Errors with some wallets due to version mismatches or strict validation.
        // We pass the Base64 bytes (string) which dApp Kit supports, avoiding object structure issues.
        const { signature: userSignature } = await signTransaction({
          transaction: txBytes, 
          account: currentAccount,
        });

        // Execute with both signatures
        const result = await suiClient.executeTransactionBlock({
            transactionBlock: fromBase64(txBytes),
            signature: [userSignature, sponsorSignature],
            requestType: 'WaitForLocalExecution',
            options: {
              showEffects: true,
              showEvents: true
            }
        });

        if (result.effects?.status.status !== 'success') {
            throw new Error(`Transaction failed on-chain: ${result.effects?.status.error || 'Unknown error'}`);
        }
        
        return result.digest;

      } catch (sponsorErr) {
        // eslint-disable-next-line no-console
        console.error("[Donate] Sponsorship attempt failed:", sponsorErr);
        throw sponsorErr;
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Transaction failed";
      setError(errorMessage);
      console.error("[Donate Error]", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentAccount, suiClient, signTransaction, streamerAddress, streamerId]);

  return {
    donate,
    isLoading,
    error,
  };
}
