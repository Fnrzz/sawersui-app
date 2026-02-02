import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { CONFIG } from "@/lib/config";

let clientInstance: SuiJsonRpcClient | null = null;

export function getSuiClient(): SuiJsonRpcClient {
  if (!clientInstance) {
    clientInstance = new SuiJsonRpcClient({
      url: CONFIG.SUI.RPC_URL,
      network: CONFIG.SUI.NETWORK
    });
  }
  return clientInstance;
}
