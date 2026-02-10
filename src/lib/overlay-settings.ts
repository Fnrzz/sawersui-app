/**
 * Shared types & defaults for overlay settings.
 * Separated from the 'use server' actions file because
 * server-action modules can only export async functions.
 */

export interface OverlaySettings {
  user_id: string;
  card_bg_color: string;
  sender_color: string;
  amount_color: string;
  message_color: string;
  sound_url: string | null;
  min_amount: number;
}

export const DEFAULT_OVERLAY_SETTINGS: Omit<OverlaySettings, "user_id"> = {
  card_bg_color: "#5B21B6",
  sender_color: "#FFDF20",
  amount_color: "#A3E635",
  message_color: "#ffffff",
  sound_url: null,
  min_amount: 0.5,
};
