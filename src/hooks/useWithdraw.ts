import { Transaction } from "@mysten/sui/transactions";
import { enokiFlow } from "@/lib/enoki/client";
import { getSuiClient } from "@/lib/sui-client";
import { isValidSuiAddress } from "@mysten/sui/utils";
import { CONFIG } from "@/lib/config";
import { jwtDecode } from "jwt-decode";

interface WithdrawParams {
  amount: number;
  recipientAddress: string;
}

interface EnokiJwtPayload {
  iss: string;
}

// Custom type for Enoki session to avoid 'any'
interface EnokiSession {
  jwt: string;
  address: string;
}

export function useWithdraw() {
  const withdraw = async ({ amount, recipientAddress }: WithdrawParams) => {
    // 1. Pre-flight Check
    const session = await enokiFlow.getSession();
    if (!session) {
      throw new Error("Unauthorized: Google Login Required");
    }

    // 2. Validation
    if (amount < 0.5) {
      throw new Error("Minimum withdrawal amount is 0.5 USDC");
    }

    // Use type assertion for session to access jwt safely
    const sessionData = session as unknown as EnokiSession;
    if (!sessionData.jwt) {
      throw new Error("Unauthorized: Invalid Session (No JWT)");
    }

    // Security Check: Verify Google Login
    try {
      const decoded = jwtDecode<EnokiJwtPayload>(sessionData.jwt);
      if (decoded.iss !== "https://accounts.google.com") {
        throw new Error(
          "Unauthorized: Only Google Login supported for withdrawals",
        );
      }
    } catch (e) {
      console.error("JWT Verification failed", e);
      throw new Error("Unauthorized: Failed to verify Google Login");
    }

    // Get address via Keypair (standard Enoki pattern)
    // We assume 'testnet' as per useZkLogin.ts
    const keypair = await enokiFlow.getKeypair({ network: "testnet" });
    const userAddress = keypair.toSuiAddress();

    const client = getSuiClient();

    // Fetch USDC coins check
    const { data: coins } = await client.getCoins({
      owner: userAddress,
      coinType: CONFIG.SUI.ADDRESS.USDC_TYPE,
    });

    if (coins.length === 0) {
      throw new Error("No USDC balance found");
    }

    // Convert amount to MIST (USDC has 6 decimals)
    const amountMist = Math.floor(amount * 1_000_000);

    // 4. Request Sponsored Transaction from Server
    // We send intent, server builds the "Gas Station" transaction for us
    const response = await fetch("/api/sponsor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sender: userAddress,
        recipientAddress: recipientAddress,
        amountMist: amountMist,
        isWithdrawal: true, // Flag to distinguish logic on server
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to get sponsorship");
    }

    const { sponsoredTransactionBytes, sponsorSignature } =
      await response.json();
    const txBytesBuffer = Buffer.from(sponsoredTransactionBytes, "base64");

    // 5. Sign with Enoki
    // We use the derived keypair to sign the transaction bytes directly.
    const { signature: userSignature } =
      await keypair.signTransaction(txBytesBuffer);

    // 6. Execute
    const result = await client.executeTransactionBlock({
      transactionBlock: txBytesBuffer,
      signature: [userSignature, sponsorSignature],
      options: {
        showEffects: true,
      },
    });

    return result;
  };

  return { withdraw };
}
