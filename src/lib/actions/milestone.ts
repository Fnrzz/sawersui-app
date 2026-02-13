"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface CreateMilestoneData {
  title: string;
  target_amount: number;
  image_blob_id: string;
  walrus_url: string;
}

export async function createMilestone(data: CreateMilestoneData) {
  const supabase = await createClient();

  // 1. Check Auth
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "User not authenticated" };
  }

  // 2. Validate Data
  if (
    !data.title ||
    !data.target_amount ||
    !data.image_blob_id ||
    !data.walrus_url
  ) {
    return { error: "Missing required fields" };
  }

  // 2.5 Check for existing active or completed (but not minted) milestones
  // Users should only have one active milestone at a time
  const { data: existingMilestone } = await supabase
    .from("milestones")
    .select("id, status")
    .eq("streamer_id", user.id)
    .in("status", ["active", "completed"])
    .maybeSingle();

  if (existingMilestone) {
    return {
      error: `You already have an ${existingMilestone.status} milestone. Please finish or cancel it first.`,
    };
  }

  // 3. Insert into DB
  const { error } = await supabase.from("milestones").insert({
    streamer_id: user.id,
    title: data.title,
    target_amount: data.target_amount,
    current_amount: 0,
    image_blob_id: data.image_blob_id,
    walrus_url: data.walrus_url,
    status: "active",
  });

  if (error) {
    console.error("Error creating milestone:", error);
    return { error: error.message };
  }

  // 4. Revalidate cache
  revalidatePath("/dashboard/obs/milestone");

  return { success: true };
}

export async function getMilestones(streamerId?: string) {
  const supabase = await createClient();

  // If no streamerId provided, try to get current user
  let targetId = streamerId;
  if (!targetId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];
    targetId = user.id;
  }

  const { data } = await supabase
    .from("milestones")
    .select("*")
    .eq("streamer_id", targetId)
    .order("created_at", { ascending: false });

  return data || [];
}

export async function cancelMilestone(milestoneId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("milestones")
    .update({ status: "cancelled" })
    .eq("id", milestoneId)
    .eq("streamer_id", user.id); // Ensure ownership

  if (error) return { error: error.message };

  revalidatePath("/dashboard/obs/milestone");
  return { success: true };
}
