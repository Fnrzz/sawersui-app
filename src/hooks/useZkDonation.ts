import { useState, useCallback } from "react";
import { useSuiClient } from "@mysten/dapp-kit";
import { CONFIG } from "@/lib/config";
import { executeEnokiDonation } from "@/lib/zklogin/transaction";
import { enokiFlow } from "@/lib/enoki/client";

interface UseZkDonationParams {
  streamerAddress: string;
  streamerId: string;
}

// ... imports

interface DonateParams {
  amount: number;
  coinType: "USDC" | "SUI";
  donorName: string;
  message: string;
}

const USDC_DECIMALS = 6;
const SUI_DECIMALS = 9;
const USDC_TYPE = CONFIG.SUI.ADDRESS.USDC_TYPE;
const SUI_TYPE = "0x2::sui::SUI";

export function useZkDonation({ streamerAddress }: UseZkDonationParams) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const suiClient = useSuiClient();

  const donate = useCallback(
    async (params: DonateParams): Promise<string> => {
      const { amount, coinType } = params;
      setIsLoading(true);
      setError(null);

      try {
        // 1. Get Session & Signer
        const session = await enokiFlow.getSession();
        if (!session || !session.jwt)
          throw new Error("No active Enoki session found");

        const signer = await enokiFlow.getKeypair({ network: "testnet" });
        const userAddress = signer.toSuiAddress();

        // 2. Check Balance
        const decimals = coinType === "SUI" ? SUI_DECIMALS : USDC_DECIMALS;
        const targetCoinType = coinType === "SUI" ? SUI_TYPE : USDC_TYPE;
        const amountMicro = BigInt(Math.floor(amount * 10 ** decimals));

        const { data: coins } = await suiClient.getCoins({
          owner: userAddress,
          coinType: targetCoinType,
        });

        if (!coins || coins.length === 0) {
          throw new Error(`No ${coinType} coins found in zkLogin wallet`);
        }

        const totalBalance = coins.reduce(
          (sum, coin) => sum + BigInt(coin.balance),
          BigInt(0),
        );

        if (totalBalance < amountMicro) {
          const required = Number(amountMicro) / 10 ** decimals;
          const available = Number(totalBalance) / 10 ** decimals;
          throw new Error(
            `Insufficient ${coinType} balance. Required: ${required}, Available: ${available.toFixed(2)}`,
          );
        }

        // 3. Execute Donation
        const digest = await executeEnokiDonation({
          userAddress,
          recipientAddress: streamerAddress,
          amount: amount,
          coinType,
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
    },
    [suiClient, streamerAddress],
  );

  return {
    donate,
    isLoading,
    error,
  };
}
