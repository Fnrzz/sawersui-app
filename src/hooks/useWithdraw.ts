import { enokiFlow } from "@/lib/enoki/client";
import { getSuiClient } from "@/lib/sui-client";
import { CONFIG } from "@/lib/config";
import { jwtDecode } from "jwt-decode";

interface EnokiJwtPayload {
  iss?: string;
  sub?: string;
  aud?: string | string[];
  exp?: number;
  nbf?: number;
  iat?: number;
  jti?: string;
  email?: string;
  name?: string;
  picture?: string;
}

interface EnokiSession {
  jwt: string;
  userAddress: string;
}

interface WithdrawParams {
  amount: number;
  recipientAddress: string;
  coinType: "USDC" | "SUI";
}

// ... existing interfaces

export function useWithdraw() {
  const withdraw = async ({
    amount,
    recipientAddress,
    coinType,
  }: WithdrawParams) => {
    // 1. Pre-flight Check
    const session = await enokiFlow.getSession();
    if (!session) {
      throw new Error("Unauthorized: Google Login Required");
    }

    // 2. Validation
    const isSui = coinType === "SUI";
    const minAmount = isSui ? 0.1 : 0.5; // Approx min amounts

    if (amount < minAmount) {
      throw new Error(`Minimum withdrawal amount is ${minAmount} ${coinType}`);
    }

    // Use type assertion for session to access jwt safely
    const sessionData = session as unknown as EnokiSession;
    if (!sessionData.jwt) {
      throw new Error("Unauthorized: Invalid Session (No JWT)");
    }

    // ... Security Check (JWT) ... (unchanged)
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
    const targetCoinType = isSui
      ? "0x2::sui::SUI"
      : CONFIG.SUI.ADDRESS.USDC_TYPE;

    // Fetch coins check
    const { data: coins } = await client.getCoins({
      owner: userAddress,
      coinType: targetCoinType,
    });

    if (coins.length === 0) {
      throw new Error(`No ${coinType} balance found`);
    }

    // Convert amount to MIST
    const decimals = isSui ? 9 : 6;
    const amountMist = Math.floor(amount * 10 ** decimals);

    // 4. Request Sponsored Transaction from Server
    // We send intent, server builds the "Gas Station" transaction for us
    const response = await fetch("/api/sponsor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sender: userAddress,
        recipientAddress: recipientAddress,
        amountMist: amountMist,
        coinType: targetCoinType,
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
