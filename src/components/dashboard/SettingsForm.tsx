"use client";

import { useState, useTransition, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  OverlaySettings,
  DEFAULT_OVERLAY_SETTINGS,
} from "@/lib/overlay-settings";
import { saveOverlaySettings } from "@/lib/actions/settings";
import { DonationAlertCard } from "@/components/overlay/DonationAlertCard";
import { RotateCcw, Save, Upload, Volume2, X } from "lucide-react";

/**
 * Debounced color field — color picker updates instantly,
 * text input debounces 400ms and only applies valid 6-digit hex.
 */
function DebouncedColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (hex: string) => void;
}) {
  const [textValue, setTextValue] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync textValue when parent value changes (e.g. reset, color picker)
  useEffect(() => {
    setTextValue(value);
  }, [value]);

  const debouncedApply = useCallback(
    (hex: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
          onChange(hex);
        }
      }, 400);
    },
    [onChange],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-zinc-800 rounded-2xl">
      {/* Color Swatch — updates preview instantly */}
      <div className="relative shrink-0">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 rounded-xl cursor-pointer appearance-none bg-transparent border-2 border-gray-200 dark:border-white/15 [&::-webkit-color-swatch-wrapper]:p-0.5 [&::-webkit-color-swatch]:rounded-lg [&::-webkit-color-swatch]:border-none"
        />
      </div>

      {/* Label */}
      <span className="text-sm font-semibold flex-1">{label}</span>

      {/* Hex Input — debounced */}
      <input
        type="text"
        value={textValue}
        onChange={(e) => {
          const val = e.target.value;
          if (/^#[0-9A-Fa-f]{0,6}$/.test(val) || val === "") {
            setTextValue(val);
            debouncedApply(val);
          }
        }}
        onBlur={() => {
          // Apply immediately on blur if valid
          if (/^#[0-9A-Fa-f]{6}$/.test(textValue)) {
            onChange(textValue);
          } else {
            setTextValue(value); // revert to last valid
          }
        }}
        className="w-24 px-3 py-2 text-xs font-mono text-center bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20"
        maxLength={7}
        placeholder="#000000"
      />
    </div>
  );
}

interface SettingsFormProps {
  initialSettings: OverlaySettings;
}

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [isPending, startTransition] = useTransition();

  // Color states
  const [cardBgColor, setCardBgColor] = useState(initialSettings.card_bg_color);
  const [senderColor, setSenderColor] = useState(initialSettings.sender_color);
  const [amountColor, setAmountColor] = useState(initialSettings.amount_color);
  const [messageColor, setMessageColor] = useState(
    initialSettings.message_color,
  );

  // Sound state
  const [soundFile, setSoundFile] = useState<File | null>(null);
  const [existingSoundUrl, setExistingSoundUrl] = useState<string | null>(
    initialSettings.sound_url,
  );

  // Min amount state
  const [minAmount, setMinAmount] = useState(initialSettings.min_amount);

  const colorFields = [
    {
      label: "Background",
      value: cardBgColor,
      setter: setCardBgColor,
      key: "card_bg_color",
    },
    {
      label: "Sender Name",
      value: senderColor,
      setter: setSenderColor,
      key: "sender_color",
    },
    {
      label: "Amount Text",
      value: amountColor,
      setter: setAmountColor,
      key: "amount_color",
    },
    {
      label: "Message Text",
      value: messageColor,
      setter: setMessageColor,
      key: "message_color",
    },
  ];

  // Live preview settings object
  const liveSettings: OverlaySettings = {
    user_id: initialSettings.user_id,
    card_bg_color: cardBgColor,
    sender_color: senderColor,
    amount_color: amountColor,
    message_color: messageColor,
    sound_url: existingSoundUrl,
    min_amount: minAmount,
  };

  function handleResetDefaults() {
    setCardBgColor(DEFAULT_OVERLAY_SETTINGS.card_bg_color);
    setSenderColor(DEFAULT_OVERLAY_SETTINGS.sender_color);
    setAmountColor(DEFAULT_OVERLAY_SETTINGS.amount_color);
    setMessageColor(DEFAULT_OVERLAY_SETTINGS.message_color);
    setMinAmount(DEFAULT_OVERLAY_SETTINGS.min_amount);
  }

  function handleSave() {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("card_bg_color", cardBgColor);
      formData.set("sender_color", senderColor);
      formData.set("amount_color", amountColor);
      formData.set("message_color", messageColor);
      formData.set("min_amount", minAmount.toString());

      if (soundFile) {
        formData.set("sound_file", soundFile);
      } else if (existingSoundUrl) {
        formData.set("keep_existing_sound", existingSoundUrl);
      }

      const result = await saveOverlaySettings(formData);

      if (result.success) {
        toast.success("Settings saved!");
      } else {
        toast.error(result.error || "Failed to save settings.");
      }
    });
  }

  function handleSoundRemove() {
    setSoundFile(null);
    setExistingSoundUrl(null);
  }

  return (
    <div className="space-y-6">
      {/* Color Pickers */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-white/5 space-y-5">
        <h2 className="font-bold text-lg">Colors</h2>

        <div className="space-y-3">
          {colorFields.map((field) => (
            <DebouncedColorField
              key={field.key}
              label={field.label}
              value={field.value}
              onChange={field.setter}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={handleResetDefaults}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Reset to defaults
        </button>
      </div>

      {/* Sound Upload */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-white/5 space-y-4">
        <h2 className="font-bold text-lg flex items-center gap-2">
          <Volume2 className="w-5 h-5" />
          Alert Sound
        </h2>

        {soundFile || existingSoundUrl ? (
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-white/10">
            <Volume2 className="w-5 h-5 text-green-500 shrink-0" />
            <span className="text-sm font-medium truncate flex-1">
              {soundFile ? soundFile.name : "Custom alert sound"}
            </span>
            <button
              type="button"
              onClick={handleSoundRemove}
              className="p-1 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-gray-300 dark:border-white/10 rounded-2xl cursor-pointer hover:border-gray-400 dark:hover:border-white/20 transition-colors">
            <Upload className="w-8 h-8 text-gray-400" />
            <span className="text-sm text-gray-500">
              Upload MP3, WAV, or OGG (max 2MB)
            </span>
            <input
              type="file"
              accept=".mp3,.wav,.ogg,audio/mpeg,audio/wav,audio/ogg"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setSoundFile(file);
              }}
            />
          </label>
        )}

        <p className="text-xs text-gray-400">
          Leave empty to use the default notification sound.
        </p>
      </div>

      {/* Min Amount */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-white/5 space-y-4">
        <h2 className="font-bold text-lg">Minimum Donation</h2>
        <p className="text-xs text-gray-400">
          Donations below this amount will not appear on the overlay.
        </p>
        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-zinc-800 rounded-2xl">
          <input
            type="number"
            min="0"
            step="0.01"
            value={minAmount}
            onChange={(e) =>
              setMinAmount(Math.max(0, parseFloat(e.target.value) || 0.5))
            }
            className="flex-1 px-4 py-3 text-base font-mono bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20"
            placeholder="0.5"
          />
          <span className="text-sm font-bold text-gray-500 shrink-0">USDC</span>
        </div>
      </div>

      {/* Live Preview */}
      <div className="space-y-3">
        <h2 className="font-bold text-lg px-2">Live Preview</h2>
        <div className="bg-zinc-100 dark:bg-zinc-900/50 rounded-3xl p-6 border border-gray-200 dark:border-white/5 flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden">
          {/* Checkerboard background */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]" />

          <div className="relative z-10 w-full flex justify-center">
            <DonationAlertCard
              data={{
                id: "preview",
                streamer_id: "preview",
                donor_name: "John Doe",
                message: "Great stream! Keep it up 🎉",
                amount_net: 25,
                tx_digest: "0x000",
                created_at: new Date().toISOString(),
                status: "completed",
              }}
              settings={liveSettings}
              preview
            />
          </div>

          <p className="mt-6 text-xs text-gray-400 font-mono">
            Colors update instantly as you pick them
          </p>
        </div>
      </div>

      {/* Save Button */}
      <button
        type="button"
        onClick={handleSave}
        disabled={isPending}
        className="w-full py-4 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-bold text-base flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        <Save className="w-5 h-5" />
        {isPending ? "Saving..." : "Save Settings"}
      </button>
    </div>
  );
}
