"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateMilestoneExpiry(
  milestoneId: string,
  additionalEpochs: number,
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "User not authenticated" };
  }

  // 1. Fetch existing milestone to get current expires_at
  const { data: milestone, error: fetchError } = await supabase
    .from("milestones")
    .select("expires_at")
    .eq("id", milestoneId)
    .eq("streamer_id", user.id)
    .single();

  if (fetchError || !milestone) {
    return { error: "Milestone not found" };
  }

  // 2. Calculate new expires_at
  // If expires_at is in the future, add to it. If passed or null, add to now.
  const currentExpiry = milestone.expires_at
    ? new Date(milestone.expires_at).getTime()
    : Date.now();

  const now = Date.now();
  // If current expiry is in the past, start from now. Otherwise extend current.
  const basisTime = currentExpiry > now ? currentExpiry : now;

  const additionalTime = additionalEpochs * 24 * 60 * 60 * 1000;
  const newExpiresAt = new Date(basisTime + additionalTime).toISOString();

  // 3. Update DB
  const { error } = await supabase
    .from("milestones")
    .update({
      expires_at: newExpiresAt,
    })
    .eq("id", milestoneId)
    .eq("streamer_id", user.id);

  if (error) {
    console.error("Error updating milestone expiry:", error);
    return { error: error.message };
  }

  revalidatePath(`/dashboard/milestone`);
  revalidatePath(`/dashboard/milestone/${milestoneId}`);

  return { success: true, newExpiresAt };
}
