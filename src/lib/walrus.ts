import { CONFIG } from "@/lib/config";

export interface DonationReceipt {
  platform: "SawerSui";
  version: "1.0";
  donor_address: string;
  donor_name: string;
  streamer_address: string;
  streamer_username: string;
  amount_usdc: number;
  tx_digest: string;
  timestamp: string;
  message: string;
  network: string;
}

export async function storeDonationReceipt(
  receipt: DonationReceipt,
): Promise<string | null> {
  const publisherUrl = CONFIG.WALRUS.PUBLISHER_URL;
  if (!publisherUrl) {
    console.warn(
      "[Walrus] Publisher URL not configured, skipping receipt storage",
    );
    return null;
  }

  try {
    const blob = new Blob([JSON.stringify(receipt, null, 2)], {
      type: "application/json",
    });

    const response = await fetch(`${publisherUrl}/v1/blobs`, {
      method: "PUT",
      body: blob,
    });

    if (!response.ok) {
      throw new Error(`Walrus upload failed: ${response.status}`);
    }

    const result = await response.json();
    const blobId =
      result.newlyCreated?.blobObject?.blobId ||
      result.alreadyCertified?.blobId ||
      null;

    if (blobId) {
      console.log("[Walrus] Receipt stored:", blobId);
    }

    return blobId;
  } catch (err) {
    console.error("[Walrus] Failed to store receipt:", err);
    return null;
  }
}

export function getReceiptUrl(blobId: string): string {
  const aggregatorUrl = CONFIG.WALRUS.AGGREGATOR_URL;
  return `${aggregatorUrl}/v1/blobs/${blobId}`;
}
