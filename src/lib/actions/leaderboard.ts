'use server'

import { createClient } from "@/lib/supabase/server";

export type LeaderboardEntry = {
  rank: number;
  donorName: string;
  totalAmount: number;
};

export async function getLeaderboard(streamerId: string, limit: number = 10): Promise<LeaderboardEntry[]> {
  const supabase = await createClient();
  
  // specific columns to minimize data transfer
  const { data, error } = await supabase
    .from('donations')
    .select('donor_name, amount_net')
    .eq('streamer_id', streamerId);

  if (error) {
    console.error("Error fetching leaderboard data:", error);
    return [];
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Aggregate donations by donor_name
  const donorMap = new Map<string, number>();

  data.forEach((donation: { donor_name: string | null, amount_net: number | null }) => {
    const name = (donation.donor_name as string) || 'Anonymous';
    const amount = Number(donation.amount_net) || 0;
    donorMap.set(name, (donorMap.get(name) || 0) + amount);
  });

  // Convert map to array and sort
  const leaderboard = Array.from(donorMap.entries())
    .map(([donorName, totalAmount]) => ({
      donorName,
      totalAmount
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, limit)
    .map((entry, index) => ({
      rank: index + 1,
      ...entry
    }));

  return leaderboard;
}
