"use client";

import { createNetworkConfig, SuiClientProvider, WalletProvider } from "@mysten/dapp-kit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import "@mysten/dapp-kit/dist/index.css";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { CONFIG } from "@/lib/config";

const { networkConfig } = createNetworkConfig({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mainnet: { url: "https://fullnode.mainnet.sui.io:443", network: "mainnet" as any },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  testnet: { url: "https://fullnode.testnet.sui.io:443", network: "testnet" as any },
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork={CONFIG.SUI.NETWORK}>
        <WalletProvider autoConnect>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}
