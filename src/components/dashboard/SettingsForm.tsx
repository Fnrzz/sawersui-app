"use client";

import { useTranslations } from "next-intl";

import { useState, useTransition, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  OverlaySettings,
  DEFAULT_OVERLAY_SETTINGS,
} from "@/lib/overlay-settings";
import { saveOverlaySettings } from "@/lib/actions/settings";
import { DonationAlertCard } from "@/components/overlay/DonationAlertCard";
import { RotateCcw, Save, Upload, Volume2, X } from "lucide-react";

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

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className="flex items-center gap-3 p-3 bg-muted rounded-xl">
      <div className="relative shrink-0">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 rounded-xl cursor-pointer appearance-none bg-transparent border-2 border-border [&::-webkit-color-swatch-wrapper]:p-0.5 [&::-webkit-color-swatch]:rounded-lg [&::-webkit-color-swatch]:border-none"
        />
      </div>

      <span className="text-sm font-semibold text-foreground flex-1">
        {label}
      </span>

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
          if (/^#[0-9A-Fa-f]{6}$/.test(textValue)) {
            onChange(textValue);
          } else {
            setTextValue(value);
          }
        }}
        className="w-24 px-3 py-2 text-base font-mono text-center bg-white rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/20"
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
  const t = useTranslations("Settings");
  const tAction = useTranslations("Action");
  const [isPending, startTransition] = useTransition();

  const [cardBgColor, setCardBgColor] = useState(initialSettings.card_bg_color);
  const [senderColor, setSenderColor] = useState(initialSettings.sender_color);
  const [amountColor, setAmountColor] = useState(initialSettings.amount_color);
  const [messageColor, setMessageColor] = useState(
    initialSettings.message_color,
  );

  const [soundFile, setSoundFile] = useState<File | null>(null);
  const [existingSoundUrl, setExistingSoundUrl] = useState<string | null>(
    initialSettings.sound_url,
  );

  const [minAmount, setMinAmount] = useState(initialSettings.min_amount);

  const colorFields = [
    {
      label: t("labels.background"),
      value: cardBgColor,
      setter: setCardBgColor,
      key: "card_bg_color",
    },
    {
      label: t("labels.sender"),
      value: senderColor,
      setter: setSenderColor,
      key: "sender_color",
    },
    {
      label: t("labels.amount"),
      value: amountColor,
      setter: setAmountColor,
      key: "amount_color",
    },
    {
      label: t("labels.message"),
      value: messageColor,
      setter: setMessageColor,
      key: "message_color",
    },
  ];

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
        toast.success(t("Dashboard.toast.settingsSaved"));
      } else {
        toast.error(result.error || t("Dashboard.toast.settingsFailed"));
      }
    });
  }

  function handleSoundRemove() {
    setSoundFile(null);
    setExistingSoundUrl(null);
  }

  return (
    <div className="space-y-6">
      {/* Preview */}
      <div className="space-y-3">
        <h2 className="font-black text-lg text-black">{t("livePreview")}</h2>
        <div className="bg-white rounded-xl p-6 border-[3px] border-black shadow-[6px_6px_0px_0px_#000] flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]" />

          <div className="relative z-10 w-full flex justify-center">
            <DonationAlertCard
              data={{
                id: "preview",
                streamer_id: "preview",
                donor_name: "John Doe",
                message: "Keren streamnya! Lanjutkan! 🎉",
                amount_net: 25,
                tx_digest: "0x000",
                created_at: new Date().toISOString(),
                status: "completed",
                sender_address: null,
                coin_type: "0x2::sui::SUI",
              }}
              settings={liveSettings}
              preview
            />
          </div>

          <p className="mt-6 text-xs font-bold text-black/40 font-mono">
            {t("previewDesc")}
          </p>
        </div>
      </div>

      {/* Colors */}
      <div className="bg-white border-[3px] border-black rounded-xl p-6 space-y-5 shadow-[6px_6px_0px_0px_#000]">
        <h2 className="font-black text-lg text-black">{t("colors")}</h2>

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
          className="flex items-center gap-2 text-sm font-bold text-black/60 hover:text-black transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          {tAction("reset") || "Reset to Defaults"}
        </button>
      </div>

      {/* Sound */}
      <div className="bg-white border-[3px] border-black rounded-xl p-6 space-y-4 shadow-[6px_6px_0px_0px_#000]">
        <h2 className="font-black text-lg text-black flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-black" />
          {t("sound")}
        </h2>

        {soundFile || existingSoundUrl ? (
          <div className="flex items-center gap-3 p-3 bg-white rounded-lg border-2 border-black">
            <Volume2 className="w-5 h-5 text-black shrink-0" />
            <span className="text-sm font-bold truncate flex-1 text-black">
              {soundFile ? soundFile.name : "Custom alert sound"}
            </span>
            <button
              type="button"
              onClick={handleSoundRemove}
              className="p-1 hover:bg-gray-100 rounded-md transition-colors border-2 border-transparent hover:border-black"
            >
              <X className="w-4 h-4 text-black" />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-black/30 rounded-xl cursor-pointer hover:border-black hover:bg-gray-50 transition-all">
            <Upload className="w-8 h-8 text-black/40" />
            <span className="text-sm font-bold text-black/60">
              {tAction("upload") || "Upload MP3, WAV, or OGG (max 500KB)"}
            </span>
            <input
              type="file"
              accept=".mp3,.wav,.ogg,audio/mpeg,audio/wav,audio/ogg"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  if (file.size > 500 * 1024) {
                    toast.error("File size exceeds 500KB");
                    return;
                  }
                  setSoundFile(file);
                }
              }}
            />
          </label>
        )}

        <p className="text-xs font-medium text-black/50">{t("soundDesc")}</p>
      </div>

      {/* Min Amount */}
      <div className="bg-white border-[3px] border-black rounded-xl p-6 space-y-4 shadow-[6px_6px_0px_0px_#000]">
        <h2 className="font-black text-lg text-black">{t("minDonation")}</h2>
        <p className="text-xs font-medium text-black/60">
          {t("minDonationDesc")}
        </p>
        <div className="flex items-center gap-3 p-3 bg-white border-2 border-black rounded-lg">
          <input
            type="number"
            min="0"
            step="0.01"
            value={minAmount}
            onChange={(e) =>
              setMinAmount(Math.max(0, parseFloat(e.target.value) || 0.5))
            }
            className="flex-1 px-2 py-1 text-base font-black font-mono bg-transparent outline-none text-black placeholder:text-black/30"
            placeholder="0.5"
          />
          <span className="text-sm font-black text-black shrink-0">USDC</span>
        </div>
      </div>

      {/* Save */}
      <button
        type="button"
        onClick={handleSave}
        disabled={isPending}
        className="w-full py-4 rounded-xl bg-[#C1E1C1] text-black border-[3px] border-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all font-black text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
      >
        <Save className="w-5 h-5" />
        {isPending ? tAction("saving") : tAction("save")}
      </button>
    </div>
  );
}
