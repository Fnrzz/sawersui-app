'use server'

import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { decodeSuiPrivateKey } from "@mysten/sui/cryptography";
import { fromBase64 } from "@mysten/sui/utils";
import { getSuiClient } from "@/lib/sui-client";

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
  } catch (error: unknown) {
    console.error("Failed to load sponsor keypair: Invalid format.");
    throw new Error("Failed to load sponsor keypair.");
  }
}

export async function getSponsorAddress(): Promise<string> {
  const kp = getSponsorKeypair();
  return kp.toSuiAddress();
}

export async function executeSponsoredDonation(
  transactionBytes: string, 
  userSignature: string
): Promise<{ digest: string; status: string }> {
  try {
    const client = getSuiClient();
    const sponsor = getSponsorKeypair();
    const txBytesBuffer = fromBase64(transactionBytes);

    // Sign with sponsor key
    const { signature: sponsorSignature } = await sponsor.signTransaction(txBytesBuffer);

    // Execute with both signatures
    const result = await client.executeTransactionBlock({
      transactionBlock: txBytesBuffer,
      signature: [userSignature, sponsorSignature],
      requestType: 'WaitForLocalExecution',
      options: {
        showEffects: true,
        showEvents: true
      }
    });

    return { 
      digest: result.digest, 
      status: result.effects?.status.status || 'UNKNOWN' 
    };

  } catch (error: unknown) {
    console.error("executeSponsoredDonation error:", error);
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to execute sponsored transaction: ${message}`);
  }
}
