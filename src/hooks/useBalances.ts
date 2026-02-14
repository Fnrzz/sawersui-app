import { getSuiClient } from "@/lib/sui-client";
import { CONFIG } from "@/lib/config";
import { useState, useEffect } from "react";

export interface Balances {
  usdc: number;
  sui: number;
}

export function useBalances(address: string | null | undefined) {
  const [balances, setBalances] = useState<Balances>({ usdc: 0, sui: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchBalances() {
      if (!address) {
        setBalances({ usdc: 0, sui: 0 });
        return;
      }

      // Only set loading on first load or manual refresh if needed, but here we just update silently for intervals
      // We can use a ref to track first load if we want to avoid flickering
    }

    async function update() {
      if (!address) return;

      try {
        const client = getSuiClient();

        // 1. Fetch USDC (6 decimals)
        const usdcCoins = await client.getCoins({
          owner: address,
          coinType: CONFIG.SUI.ADDRESS.USDC_TYPE,
        });
        const usdcTotal = usdcCoins.data.reduce(
          (acc, coin) => acc + parseInt(coin.balance),
          0,
        );

        // 2. Fetch SUI (9 decimals) - Native Coin
        const suiCoins = await client.getCoins({
          owner: address,
          coinType: "0x2::sui::SUI",
        });
        const suiTotal = suiCoins.data.reduce(
          (acc, coin) => acc + parseInt(coin.balance),
          0,
        );

        if (isMounted) {
          setBalances({
            usdc: usdcTotal / 1_000_000,
            sui: suiTotal / 1_000_000_000, // SUI has 9 decimals
          });
          setError(null);
        }
      } catch (err) {
        console.error("Failed to fetch balances:", err);
        if (isMounted) {
          setError("Failed to load balances");
        }
      }
    }

    setIsLoading(true);
    update().finally(() => {
      if (isMounted) setIsLoading(false);
    });

    const interval = setInterval(update, 10000); // Poll every 10s
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [address]);

  return { balances, isLoading, error };
}
