import { getSuiClient } from "@/lib/sui-client";
import { CONFIG } from "@/lib/config";
import { useState, useEffect } from "react";

export function useUsdcBalance(address: string | null | undefined) {
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBalance() {
      if (!address) {
        setBalance(0);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const client = getSuiClient();
        const { data: coins } = await client.getCoins({
          owner: address,
          coinType: CONFIG.SUI.ADDRESS.USDC_TYPE,
        });

        const totalBalance = coins.reduce(
          (acc, coin) => acc + parseInt(coin.balance),
          0,
        );

        // Convert to USDC (6 decimals)
        setBalance(totalBalance / 1_000_000);
      } catch (err) {
        console.error("Failed to fetch USDC balance:", err);
        setError("Failed to load balance");
      } finally {
        setIsLoading(false);
      }
    }

    fetchBalance();

    // Refresh interval (optional, every 10s)
    const interval = setInterval(fetchBalance, 10000);
    return () => clearInterval(interval);
  }, [address]);

  return { balance, isLoading, error };
}
