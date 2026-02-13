import { getSuiClient } from "@/lib/sui-client";
import { CONFIG } from "@/lib/config";

export interface RewardNFT {
  objectId: string;
  imageUrl: string;
  name?: string;
}

export async function getLatestMilestoneNft(
  address: string,
): Promise<RewardNFT | null> {
  try {
    const client = getSuiClient();

    const { data } = await client.getOwnedObjects({
      owner: address,
      filter: {
        StructType: `${CONFIG.SUI.ADDRESS.MINT_NFT_PACKAGE_ID}::reward_nft::RewardNFT`,
      },
      options: {
        showDisplay: true,
        showContent: true,
      },
    });

    if (!data || data.length === 0) {
      return null;
    }

    // Sort by objectId descending as a proxy for "latest" since we don't have mint time
    // This is a heuristic, but often works for sequentially created objects or similar enough
    const sorted = data.sort((a, b) => {
      return b.data?.objectId.localeCompare(a.data?.objectId || "") || 0;
    });

    const latest = sorted[0];

    if (
      latest.data?.display?.data &&
      typeof latest.data.display.data === "object"
    ) {
      const display = latest.data.display.data as Record<string, string>;
      return {
        objectId: latest.data.objectId,
        imageUrl: display.image_url || "",
        name: display.name,
      };
    }

    return null;
  } catch (error) {
    console.error("Error fetching milestone NFT:", error);
    return null;
  }
}

export async function getOwnedMilestoneNfts(
  address: string,
): Promise<RewardNFT[]> {
  try {
    const client = getSuiClient();

    let hasNextPage = true;
    let nextCursor: string | null = null;
    let allNfts: RewardNFT[] = [];

    while (hasNextPage) {
      const {
        data,
        nextCursor: cursor,
        hasNextPage: hasNext,
      } = await client.getOwnedObjects({
        owner: address,
        filter: {
          StructType: `${CONFIG.SUI.ADDRESS.MINT_NFT_PACKAGE_ID}::reward_nft::RewardNFT`,
        },
        options: {
          showDisplay: true,
          showContent: true,
        },
        cursor: nextCursor,
      });

      if (data) {
        for (const item of data) {
          if (
            item.data?.display?.data &&
            typeof item.data.display.data === "object"
          ) {
            const display = item.data.display.data as Record<string, string>;
            allNfts.push({
              objectId: item.data.objectId,
              imageUrl: display.image_url || "",
              name: display.name,
            });
          }
        }
      }

      nextCursor = cursor as string | null;
      hasNextPage = hasNext;
    }

    return allNfts;
  } catch (error) {
    console.error("Error fetching all milestone NFTs:", error);
    return [];
  }
}
