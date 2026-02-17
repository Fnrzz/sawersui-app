import { CONFIG } from "@/lib/config";

// ─── URLs — driven by NEXT_PUBLIC_SUI_NETWORK in config.ts ───
export const WALRUS_PUBLISHER_URL = CONFIG.WALRUS.PUBLISHER_URL;
export const WALRUS_AGGREGATOR_URL = CONFIG.WALRUS.AGGREGATOR_URL;

export interface WalrusUploadResponse {
  newlyCreated: {
    blobObject: {
      id?: string;
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
  blobObjectId: string;
  url: string;
  expirationEpoch: number;
  expiresAt: string;
}> {
  try {
    const arrayBuffer = await file.arrayBuffer();

    // Build URL — clean PUT request to Publisher
    const url = `${WALRUS_PUBLISHER_URL}?epochs=${epochs}`;

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/octet-stream",
      },
      body: arrayBuffer,
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
    const blobObjectId = data.newlyCreated?.blobObject?.id ?? "";

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
      blobObjectId,
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
