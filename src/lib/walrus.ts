export const WALRUS_PUBLISHER_URL =
  "https://publisher.walrus-testnet.walrus.space/v1/blobs";
export const WALRUS_AGGREGATOR_URL =
  "https://aggregator.walrus-testnet.walrus.space/v1/blobs/";

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

export async function uploadToWalrus(
  file: File,
  epochs: number = 53, // Default to MAX allowed epochs
): Promise<{
  blobId: string;
  url: string;
  expirationEpoch: number;
  expiresAt: string;
}> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const response = await fetch(`${WALRUS_PUBLISHER_URL}?epochs=${epochs}`, {
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
    // Walrus response structure for alreadyCertified might be slightly different or same,
    // but based on type def:
    // newlyCreated.blobObject.storage.endEpoch
    // alreadyCertified.endEpoch

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
