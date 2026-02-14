"use server";

import { createClient } from "@/lib/supabase/server";
import {
  OverlaySettings,
  DEFAULT_OVERLAY_SETTINGS,
} from "@/lib/overlay-settings";

/**
 * Fetch overlay settings for a user. Returns defaults if none exist.
 */
export async function getOverlaySettings(
  userId: string,
): Promise<OverlaySettings> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("overlay_settings")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return { user_id: userId, ...DEFAULT_OVERLAY_SETTINGS };
  }

  return {
    user_id: userId,
    ...DEFAULT_OVERLAY_SETTINGS,
    ...data,
    // Ensure min_amount is never null (old rows may not have it)
    min_amount: data.min_amount ?? DEFAULT_OVERLAY_SETTINGS.min_amount,
  } as OverlaySettings;
}

/**
 * Save overlay settings (upsert). Handles color fields + optional sound file upload.
 */
export async function saveOverlaySettings(
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Verify authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Extract color values
  const card_bg_color = formData.get("card_bg_color") as string;
  const sender_color = formData.get("sender_color") as string;
  const amount_color = formData.get("amount_color") as string;
  const message_color = formData.get("message_color") as string;

  // Extract min_amount
  const min_amount_raw = formData.get("min_amount") as string;
  const min_amount = Math.max(0, parseFloat(min_amount_raw) || 0);

  // Validate hex colors
  const hexRegex = /^#[0-9A-Fa-f]{6}$/;
  if (
    !hexRegex.test(card_bg_color) ||
    !hexRegex.test(sender_color) ||
    !hexRegex.test(amount_color) ||
    !hexRegex.test(message_color)
  ) {
    return {
      success: false,
      error: "Invalid color format. Use hex (#RRGGBB).",
    };
  }

  // Handle sound file upload
  let sound_url: string | null = null;
  const soundFile = formData.get("sound_file") as File | null;
  const keepExistingSound = formData.get("keep_existing_sound") as string;

  if (soundFile && soundFile.size > 0) {
    // Validate file type
    const allowedTypes = ["audio/mpeg", "audio/wav", "audio/ogg", "audio/mp3"];
    if (!allowedTypes.includes(soundFile.type)) {
      return {
        success: false,
        error: "Invalid file type. Use MP3, WAV, or OGG.",
      };
    }

    // Validate file size (max 500KB)
    if (soundFile.size > 500 * 1024) {
      return { success: false, error: "File too large. Maximum 500KB." };
    }

    const fileExt = soundFile.name.split(".").pop();
    const filePath = `${user.id}/alert.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("alert-sounds")
      .upload(filePath, soundFile, { upsert: true });

    if (uploadError) {
      console.error("Sound upload error:", uploadError);
      return { success: false, error: "Failed to upload sound file." };
    }

    const { data: publicUrl } = supabase.storage
      .from("alert-sounds")
      .getPublicUrl(filePath);

    sound_url = publicUrl.publicUrl;
  } else if (keepExistingSound) {
    sound_url = keepExistingSound;
  }

  // Upsert settings
  const { error } = await supabase.from("overlay_settings").upsert(
    {
      user_id: user.id,
      card_bg_color,
      sender_color,
      amount_color,
      message_color,
      sound_url,
      min_amount,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    console.error("Settings save error:", error);
    return { success: false, error: "Failed to save settings." };
  }

  return { success: true };
}
