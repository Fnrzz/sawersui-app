export const CONFIG = {
  SUI: {
    NETWORK:
      (process.env.NEXT_PUBLIC_SUI_NETWORK as "mainnet" | "testnet") ||
      "testnet",
    RPC_URL:
      process.env.NEXT_PUBLIC_SUI_NETWORK === "mainnet"
        ? "https://fullnode.mainnet.sui.io:443"
        : "https://fullnode.testnet.sui.io:443",
    ADDRESS: {
      USDC_TYPE: process.env.NEXT_PUBLIC_ADDRESS_USDC!,
      PACKAGE_ID: process.env.NEXT_PUBLIC_PACKAGE_ID!,
      CONFIG_ID: process.env.NEXT_PUBLIC_CONFIG_ID!,
      MINT_NFT_PACKAGE_ID: process.env.NEXT_PUBLIC_PACKAGE_ID_MINT_NFT!,
      ADMIN_CAP: process.env.NEXT_PUBLIC_ADMIN_CAP!,
    },
  },
  SUPABASE: {
    URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  },
} as const;

// Quick checks to warn in dev
if (typeof window === "undefined") {
  // Server-side check
  if (!CONFIG.SUPABASE.URL) console.warn("Missing NEXT_PUBLIC_SUPABASE_URL");
  if (!CONFIG.SUI.ADDRESS.USDC_TYPE)
    console.warn("Missing NEXT_PUBLIC_ADDRESS_USDC");
}
