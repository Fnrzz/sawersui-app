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
): Promise<{ blobId: string; url: string }> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const response = await fetch(`${WALRUS_PUBLISHER_URL}?epochs=1`, {
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
    const blobId =
      data.newlyCreated?.blobObject.blobId || data.alreadyCertified?.blobId;

    if (!blobId) {
      throw new Error("No blobId returned from Walrus");
    }

    return {
      blobId,
      url: `${WALRUS_AGGREGATOR_URL}${blobId}`,
    };
  } catch (error) {
    console.error("Error uploading to Walrus:", error);
    throw error;
  }
}
