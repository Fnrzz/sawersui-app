import { Transaction } from "@mysten/sui/transactions";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { getSuiClient } from "@/lib/sui-client";
import { CONFIG } from "@/lib/config";
import type { WalrusClient } from "@mysten/walrus";

// Lazy initialize WalrusClient with dynamic import
let walrusClientInstance: WalrusClient | null = null;
export async function getWalrusClient(): Promise<WalrusClient> {
  if (!walrusClientInstance) {
    const { WalrusClient } = await import("@mysten/walrus");
    walrusClientInstance = new WalrusClient({
      network: CONFIG.SUI.NETWORK === "mainnet" ? "mainnet" : "testnet",
      suiClient: getSuiClient(),
    });
  }
  return walrusClientInstance;
}

// ─── URLs — driven by NEXT_PUBLIC_SUI_NETWORK in config.ts ───
export const WALRUS_PUBLISHER_URL = CONFIG.WALRUS.PUBLISHER_URL;
export const WALRUS_AGGREGATOR_URL = CONFIG.WALRUS.AGGREGATOR_URL;

export interface WalrusUploadResponse {
  newlyCreated: {
    blobObject: {
      blobId: string;
      storage: {
        id: string;
        startEpoch: number;
        endEpoch: number;
        storageSize: number;
      };
      encoding: {
        type: string;
        version: number;
        decompressedSize: number;
      };
    };
    resourceOperation: {
      registerEvent: {
        blobId: string;
        resourceId: string;
      };
    };
    cost: number;
  };
  alreadyCertified?: {
    blobId: string;
    endEpoch: number;
  };
}

/**
 * Upload a file to Walrus via the HTTP publisher.
 *
 * @param file The file to upload
 * @param epochs Duration in epochs (default 2)
 */
export async function uploadToWalrus(
  file: File,
  epochs: number = 2,
): Promise<{
  blobId: string;
  url: string;
  expirationEpoch: number;
  expiresAt: string;
}> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Build URL — clean PUT request to Publisher
    const url = `${WALRUS_PUBLISHER_URL}?epochs=${epochs}`;

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/octet-stream",
      },
      body: buffer,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to upload to Walrus (${response.status} ${response.statusText}): ${errorText}`,
      );
    }

    const data: WalrusUploadResponse = await response.json();

    // Check if newlyCreated or alreadyCertified
    const blobObject = data.newlyCreated?.blobObject || data.alreadyCertified;
    const blobId = blobObject?.blobId || data.alreadyCertified?.blobId;

    let expirationEpoch = 0;
    if (data.newlyCreated) {
      expirationEpoch = data.newlyCreated.blobObject.storage.endEpoch;
    } else if (data.alreadyCertified) {
      expirationEpoch = data.alreadyCertified.endEpoch;
    }

    if (!blobId) {
      throw new Error("No blobId returned from Walrus");
    }

    return {
      blobId,
      url: `${WALRUS_AGGREGATOR_URL}${blobId}`,
      expirationEpoch,
      expiresAt: new Date(
        Date.now() + epochs * 24 * 60 * 60 * 1000,
      ).toISOString(),
    };
  } catch (error) {
    console.error("Error uploading to Walrus:", error);
    throw error;
  }
}

// ─── purchaseAndUploadToWalrus removed — Publisher doesn't support storage_id ───
