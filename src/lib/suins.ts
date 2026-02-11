import { SuinsClient } from "@mysten/suins";
import { getSuiClient } from "@/lib/sui-client";
import { CONFIG } from "@/lib/config";

let suinsClient: SuinsClient | null = null;

export function getSuinsClient(): SuinsClient {
  if (!suinsClient) {
    const client = getSuiClient();
    suinsClient = new SuinsClient({
      client,
      network: CONFIG.SUI.NETWORK === "mainnet" ? "mainnet" : "testnet",
    });
  }
  return suinsClient;
}

/**
 * Resolve a .sui name to its target address.
 * Returns the target address or null if not found.
 */
export async function resolveNameToAddress(
  name: string,
): Promise<string | null> {
  try {
    const client = getSuinsClient();
    const record = await client.getNameRecord(name);
    return record?.targetAddress || null;
  } catch {
    return null;
  }
}

/**
 * Reverse lookup: address -> .sui name
 * Uses Sui RPC to query the SuiNS reverse registry.
 * Returns the default name or null.
 */
export async function resolveAddressToName(
  address: string,
): Promise<string | null> {
  try {
    const client = getSuiClient();
    // Use suix_resolveNameServiceNames RPC method
    const result = await client.resolveNameServiceNames({ address });
    if (result.data && result.data.length > 0) {
      return result.data[0];
    }
    return null;
  } catch {
    return null;
  }
}
