"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  LeaderboardSettings,
  DEFAULT_LEADERBOARD_SETTINGS,
} from "@/lib/leaderboard-settings";

export async function getLeaderboardSettings(
  userId: string,
): Promise<LeaderboardSettings> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leaderboard_settings")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return {
      user_id: userId,
      ...DEFAULT_LEADERBOARD_SETTINGS,
    };
  }

  return data as LeaderboardSettings;
}

export async function updateLeaderboardSettings(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const settings = {
    user_id: user.id,
    bg_color: formData.get("bg_color") as string,
    title_color: formData.get("title_color") as string,
    text_color: formData.get("text_color") as string,
    rank_color: formData.get("rank_color") as string,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("leaderboard_settings")
    .upsert(settings);

  if (error) {
    console.error("Error updating leaderboard settings:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/obs/leaderboard");
  return { success: true };
}
