import { useState, useCallback } from "react";
import { useSuiClient } from "@mysten/dapp-kit";
import { CONFIG } from "@/lib/config";
import { executeEnokiDonation } from "@/lib/zklogin/transaction";
import { enokiFlow } from "@/lib/enoki/client";

interface UseZkDonationParams {
  streamerAddress: string;
  streamerId: string;
}

interface DonateParams {
  amountUsdc: number;
  donorName: string; // Kept for interface compatibility, though might be unused in tx
  message: string;
}

const USDC_DECIMALS = 6;
const USDC_TYPE = CONFIG.SUI.ADDRESS.USDC_TYPE;

export function useZkDonation({ streamerAddress }: UseZkDonationParams) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const suiClient = useSuiClient();

  const donateUSDC = useCallback(async (params: DonateParams): Promise<string> => {
    const { amountUsdc } = params;
    setIsLoading(true);
    setError(null);

    try {
      // 1. Get Session & Signer
      const session = await enokiFlow.getSession();
      if (!session || !session.jwt) throw new Error("No active Enoki session found");

      const signer = await enokiFlow.getKeypair({ network: 'testnet' });
      const userAddress = signer.toSuiAddress();

      // 2. Check Balance
      const amountMicro = BigInt(Math.floor(amountUsdc * 10 ** USDC_DECIMALS));
      
      const { data: coins } = await suiClient.getCoins({
        owner: userAddress,
        coinType: USDC_TYPE,
      });

      if (!coins || coins.length === 0) {
        throw new Error("No USDC coins found in zkLogin wallet");
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

      // 3. Execute Donation
      const digest = await executeEnokiDonation({
        userAddress,
        recipientAddress: streamerAddress,
        amount: amountUsdc,
        suiClient,
      });

      return digest;

    } catch (err) {
      console.error("[ZkDonate Error]", err);
      const msg = err instanceof Error ? err.message : "Donation failed";
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [suiClient, streamerAddress]);

  return {
    donateUSDC,
    isLoading,
    error
  };
}

