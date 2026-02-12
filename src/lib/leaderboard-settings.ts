export interface LeaderboardSettings {
  user_id: string;
  bg_color: string;
  title_color: string;
  text_color: string;
  rank_color: string;
}

export const DEFAULT_LEADERBOARD_SETTINGS: Omit<
  LeaderboardSettings,
  "user_id"
> = {
  bg_color: "#1f2937",
  title_color: "#fbbf24",
  text_color: "#ffffff",
  rank_color: "#22c55e",
};
