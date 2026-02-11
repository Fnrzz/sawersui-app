"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import type { GatedContentMeta, GatedContentWithAccess } from "@/lib/seal";

export async function getExclusiveContent(
  streamerId: string,
): Promise<GatedContentMeta[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("exclusive_content")
    .select(
      "id, streamer_id, title, description, min_donation_usdc, content_type, created_at",
    )
    .eq("streamer_id", streamerId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching exclusive content:", error);
    return [];
  }

  return data || [];
}

export async function getExclusiveContentWithAccess(
  streamerId: string,
  donorAddress: string | null,
): Promise<GatedContentWithAccess[]> {
  const contents = await getExclusiveContent(streamerId);

  if (!donorAddress) {
    return contents.map((c) => ({
      ...c,
      has_access: false,
      total_donated: 0,
    }));
  }

  // Get total donated by this donor to this streamer
  const supabase = await createClient();
  const { data: donations } = await supabase
    .from("donations")
    .select("amount_net")
    .eq("streamer_id", streamerId);

  const totalDonated = (donations || []).reduce(
    (sum, d) => sum + (d.amount_net || 0),
    0,
  );

  return contents.map((c) => ({
    ...c,
    has_access: totalDonated >= c.min_donation_usdc,
    total_donated: totalDonated,
  }));
}

export async function createExclusiveContent(params: {
  title: string;
  description: string;
  minDonationUsdc: number;
  walrusBlobId: string;
  contentType: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  if (!params.title.trim()) {
    return { success: false, error: "Title is required" };
  }

  if (params.minDonationUsdc < 0.5) {
    return { success: false, error: "Minimum donation must be at least 0.50 USDC" };
  }

  const admin = await createAdminClient();
  const { error } = await admin.from("exclusive_content").insert({
    streamer_id: user.id,
    title: params.title.trim(),
    description: params.description.trim() || null,
    min_donation_usdc: params.minDonationUsdc,
    walrus_blob_id: params.walrusBlobId,
    content_type: params.contentType,
  });

  if (error) {
    console.error("Error creating exclusive content:", error);
    return { success: false, error: "Failed to create content" };
  }

  return { success: true };
}

export async function deleteExclusiveContent(
  contentId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("exclusive_content")
    .delete()
    .eq("id", contentId)
    .eq("streamer_id", user.id);

  if (error) {
    console.error("Error deleting exclusive content:", error);
    return { success: false, error: "Failed to delete content" };
  }

  return { success: true };
}

export async function getExclusiveContentBlob(
  contentId: string,
  streamerId: string,
): Promise<{ blobId: string | null; error?: string }> {
  // Verify the content exists and belongs to this streamer
  const supabase = await createClient();
  const { data } = await supabase
    .from("exclusive_content")
    .select("walrus_blob_id")
    .eq("id", contentId)
    .eq("streamer_id", streamerId)
    .single();

  if (!data) {
    return { blobId: null, error: "Content not found" };
  }

  return { blobId: data.walrus_blob_id };
}
