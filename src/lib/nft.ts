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

    // Extract all valid NFTs
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const allNfts: RewardNFT[] = [];

    for (const item of data) {
      if (
        item.data?.display?.data &&
        typeof item.data.display.data === "object"
      ) {
        const display = item.data.display.data as Record<string, string>;
        const imageUrl = display.image_url || "";
        if (imageUrl) {
          allNfts.push({
            objectId: item.data.objectId,
            imageUrl,
            name: display.name,
          });
        }
      }
    }

    if (allNfts.length === 0) return null;

    // Prefer NFTs with Supabase Storage URLs (latest architecture) over old Walrus URLs
    const supabaseNft = allNfts.find((nft) =>
      nft.imageUrl.startsWith(`${supabaseUrl}/storage/v1/object/public/`),
    );

    return supabaseNft || allNfts[0];
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
    const allNfts: RewardNFT[] = [];

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
            const imageUrl = display.image_url || "";
            if (imageUrl) {
              allNfts.push({
                objectId: item.data.objectId,
                imageUrl,
                name: display.name,
              });
            }
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
