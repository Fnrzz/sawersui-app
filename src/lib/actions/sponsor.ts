"use server";

import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { decodeSuiPrivateKey } from "@mysten/sui/cryptography";
import { fromBase64, normalizeSuiAddress } from "@mysten/sui/utils";
import { getSuiClient } from "@/lib/sui-client";
import { Transaction, TransactionData } from "@mysten/sui/transactions";
import { CONFIG } from "@/lib/config";

const SPONSOR_SECRET_KEY = process.env.SPONSOR_SECRET_KEY || "";

function getSponsorKeypair(): Ed25519Keypair {
  if (!SPONSOR_SECRET_KEY) {
    throw new Error("SPONSOR_SECRET_KEY is not set in environment variables");
  }

  try {
    if (SPONSOR_SECRET_KEY.startsWith("suiprivkey")) {
      const { secretKey } = decodeSuiPrivateKey(SPONSOR_SECRET_KEY);
      return Ed25519Keypair.fromSecretKey(secretKey);
    }

    const rawBytes = fromBase64(SPONSOR_SECRET_KEY);
    if (rawBytes.length === 32) {
      return Ed25519Keypair.fromSecretKey(rawBytes);
    }

    throw new Error("Invalid key length. Expected 32 bytes.");
  } catch {
    console.error("Failed to load sponsor keypair: Invalid format.");
    throw new Error("Failed to load sponsor keypair.");
  }
}

export async function getSponsorAddress(): Promise<string> {
  const kp = getSponsorKeypair();
  return kp.toSuiAddress();
}

const ALLOWED_COMMANDS = new Set([
  "MoveCall",
  "SplitCoins",
  "MergeCoins",
  "MakeMoveVec",
]);

function validateSponsorshipEligibility(txData: TransactionData) {
  const allowedPackageId = normalizeSuiAddress(CONFIG.SUI.ADDRESS.PACKAGE_ID);
  let hasAllowedMoveCall = false;

  for (const command of txData.commands) {
    if (!ALLOWED_COMMANDS.has(command.$kind)) {
      throw new Error(
        `Unauthorized command type: ${command.$kind}. Allowed: ${Array.from(
          ALLOWED_COMMANDS,
        ).join(", ")}`,
      );
    }

    if (command.$kind === "MoveCall") {
      const targetPackageId = normalizeSuiAddress(command.MoveCall.package);

      if (targetPackageId !== allowedPackageId) {
        throw new Error(
          `Unauthorized package access: ${targetPackageId}. Sponsorship only allowed for ${allowedPackageId}`,
        );
      }
      hasAllowedMoveCall = true;
    }
  }

  if (!hasAllowedMoveCall) {
    throw new Error(
      `Transaction must include a MoveCall to the allowed package ${allowedPackageId}.`,
    );
  }
}

export async function executeSponsoredDonation(
  transactionBytes: string,
  userSignature: string,
): Promise<{ digest: string; status: string }> {
  try {
    const client = getSuiClient();
    const sponsor = getSponsorKeypair();
    const txBytesBuffer = fromBase64(transactionBytes);

    // Sign with sponsor key
    const tx = Transaction.from(txBytesBuffer);
    const txData = tx.getData();

    validateSponsorshipEligibility(txData);

    const { signature: sponsorSignature } =
      await sponsor.signTransaction(txBytesBuffer);

    // Execute with both signatures
    const result = await client.executeTransactionBlock({
      transactionBlock: txBytesBuffer,
      signature: [userSignature, sponsorSignature],
      requestType: "WaitForLocalExecution",
      options: {
        showEffects: true,
        showEvents: true,
      },
    });

    return {
      digest: result.digest,
      status: result.effects?.status.status || "UNKNOWN",
    };
  } catch (error: unknown) {
    console.error("executeSponsoredDonation error:", error);
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to execute sponsored transaction: ${message}`);
  }
}
