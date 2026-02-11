"use client";

import { useState, useCallback } from "react";
import {
  storeDonationReceipt,
  getReceiptUrl,
  DonationReceipt,
} from "@/lib/walrus";
import { CONFIG } from "@/lib/config";

interface StoreReceiptParams {
  donorAddress: string;
  donorName: string;
  streamerAddress: string;
  streamerUsername: string;
  amountUsdc: number;
  txDigest: string;
  message: string;
}

export function useWalrusReceipt() {
  const [isStoring, setIsStoring] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);

  const storeReceipt = useCallback(async (params: StoreReceiptParams) => {
    setIsStoring(true);
    try {
      const receipt: DonationReceipt = {
        platform: "SawerSui",
        version: "1.0",
        donor_address: params.donorAddress,
        donor_name: params.donorName,
        streamer_address: params.streamerAddress,
        streamer_username: params.streamerUsername,
        amount_usdc: params.amountUsdc,
        tx_digest: params.txDigest,
        timestamp: new Date().toISOString(),
        message: params.message,
        network: CONFIG.SUI.NETWORK,
      };

      const blobId = await storeDonationReceipt(receipt);
      if (blobId) {
        const url = getReceiptUrl(blobId);
        setReceiptUrl(url);
        return blobId;
      }
      return null;
    } finally {
      setIsStoring(false);
    }
  }, []);

  return { storeReceipt, isStoring, receiptUrl };
}
