import { fromBase64 } from "@mysten/sui/utils";
import { CONFIG } from "@/lib/config";
// Enoki Flow
import { enokiFlow } from "@/lib/enoki/client";

const USCD_DECIMALS = 6;
const SUI_DECIMALS = 9;
const USDC_COIN_TYPE = CONFIG.SUI.ADDRESS.USDC_TYPE;
const SUI_COIN_TYPE = "0x2::sui::SUI";

interface ExecuteEnokiDonationParams {
  userAddress: string;
  recipientAddress: string;
  amount: number;
  coinType: "USDC" | "SUI";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  suiClient: any;
}

export async function executeEnokiDonation({
  userAddress,
  recipientAddress,
  amount,
  coinType,
  suiClient,
}: ExecuteEnokiDonationParams) {
  // 1. Get the Enoki Signer
  // Switching to 'testnet' as API key likely requires it (Trynet/Testnet)
  const signer = await enokiFlow.getKeypair({ network: "testnet" });

  // 2. Prepare Payload
  const decimals = coinType === "SUI" ? SUI_DECIMALS : USCD_DECIMALS;
  const targetCoinType = coinType === "SUI" ? SUI_COIN_TYPE : USDC_COIN_TYPE;

  const amountMicro = BigInt(Math.floor(amount * 10 ** decimals));
  console.log(`Fetching Sponsored Transaction for ${coinType}...`);

  const payload = {
    sender: userAddress,
    streamerAddress: recipientAddress,
    amountMist: amountMicro.toString(),
    coinType: targetCoinType,
  };

  // 3. Fetch Sponsorship
  const response = await fetch("/api/sponsor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to sponsor transaction");
  }

  const data = await response.json();
  const { sponsoredTransactionBytes, sponsorSignature } = data;

  if (typeof sponsoredTransactionBytes !== "string") {
    throw new Error("Invalid response: missing sponsoredTransactionBytes");
  }

  // 4. Decode Transaction
  const txBytes = fromBase64(sponsoredTransactionBytes);
  // Unused transaction object
  // const transaction = Transaction.from(txBytes);

  console.log("Executing Transaction...");

  // 5. Execute
  // We use the client to sign and execute.
  // However, since we have a sponsored transaction with an existing signature (sponsorSignature),
  // we need to be careful. The `signAndExecuteTransaction` method might not easily attach the sponsor signature
  // if we just pass the `transaction` object.
  // We'll use the signer to sign the bytes, then execute manually with both signatures.

  // Re-build/serialize is not needed if we trust the bytes, but signer.signTransaction expects bytes or logic.
  // Enoki signer.signTransaction should handle the ZK proof attachment if needed (abstracted).
  // Note: if signer is smart, it returns the ZK Signature.

  // Option A: Use signAndExecuteTransaction (User request)
  // This is cleaner but assumes no sponsorship complication.
  // But wait, if we have sponsorSignature, we MUST include it.

  // Let's try to pass the transaction to signAndExecuteTransaction.
  // If we can't attach sponsorSig, we fallback to manual execution.

  // Manual Execution Flow (Robust for Sponsorship):
  const { signature: userSignature } = await signer.signTransaction(txBytes);

  const result = await suiClient.executeTransactionBlock({
    transactionBlock: txBytes,
    signature: [userSignature, sponsorSignature],
    requestType: "WaitForLocalExecution",
    options: {
      showEffects: true,
      showEvents: true,
    },
  });

  if (result.effects?.status.status !== "success") {
    throw new Error(
      `Transaction failed: ${result.effects?.status.error || "Unknown error"}`,
    );
  }

  console.log("Transaction Success:", result.digest);
  return result.digest;
}
