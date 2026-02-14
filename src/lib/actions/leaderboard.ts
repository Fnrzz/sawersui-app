"use server";

import { createClient } from "@/lib/supabase/server";

export type LeaderboardEntry = {
  rank: number;
  donorName: string;
  totalAmount: number;
  coinType: "USDC" | "SUI";
};

export async function getLeaderboard(
  streamerId: string,
  limit: number = 10,
): Promise<LeaderboardEntry[]> {
  const supabase = await createClient();

  // specific columns to minimize data transfer
  const { data, error } = await supabase
    .from("donations")
    .select("donor_name, amount_net, coin_type")
    .eq("streamer_id", streamerId);

  if (error) {
    console.error("Error fetching leaderboard data:", error);
    return [];
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Aggregate donations by donor_name AND coin_type
  // Key format: "DonorName|CoinType"
  const donorMap = new Map<string, number>();

  data.forEach(
    (donation: {
      donor_name: string | null;
      amount_net: number | null;
      coin_type: string | null;
    }) => {
      const name = (donation.donor_name as string) || "Anonymous";
      const amount = Number(donation.amount_net) || 0;
      const coin = (donation.coin_type as string) || "USDC"; // Default to USDC for old records

      const key = `${name}|${coin}`;
      donorMap.set(key, (donorMap.get(key) || 0) + amount);
    },
  );

  // Convert map to array and sort
  const leaderboard = Array.from(donorMap.entries())
    .map(([key, totalAmount]) => {
      const [donorName, coinTypeFull] = key.split("|");
      // Map full coin type back to short code for UI
      const coinTypeShort = coinTypeFull.includes("0x2::sui::SUI")
        ? "SUI"
        : "USDC";

      return {
        donorName,
        totalAmount,
        coinType: coinTypeShort as "USDC" | "SUI",
      };
    })
    .sort((a, b) => b.totalAmount - a.totalAmount) // Sort by amount (absolute value, might mix currencies but valid for "Top Donors")
    .slice(0, limit)
    .map((entry, index) => ({
      rank: index + 1,
      ...entry,
    }));

  return leaderboard;
}
