import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { decodeSuiPrivateKey } from "@mysten/sui/cryptography";
import { fromBase64 } from "@mysten/sui/utils";
import { getSuiClient } from "@/lib/sui-client";

const SPONSOR_SECRET_KEY = process.env.SPONSOR_SECRET_KEY || "";

/**
 * Returns the sponsor Ed25519Keypair from env.
 * Supports both `suiprivkey` encoded format and raw base64 (32 bytes).
 */
export function getSponsorKeypair(): Ed25519Keypair {
  if (!SPONSOR_SECRET_KEY) {
    throw new Error("SPONSOR_SECRET_KEY is not set in environment variables");
  }

  if (SPONSOR_SECRET_KEY.startsWith("suiprivkey")) {
    const { secretKey } = decodeSuiPrivateKey(SPONSOR_SECRET_KEY);
    return Ed25519Keypair.fromSecretKey(secretKey);
  }

  const rawBytes = fromBase64(SPONSOR_SECRET_KEY);
  if (rawBytes.length === 32) {
    return Ed25519Keypair.fromSecretKey(rawBytes);
  }

  throw new Error("Invalid key length. Expected 32 bytes.");
}

/**
 * Returns a configured SuiClient (singleton from sui-client.ts).
 */
export { getSuiClient };
