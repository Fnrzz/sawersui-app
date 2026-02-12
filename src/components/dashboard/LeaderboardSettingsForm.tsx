"use client";

import { useState, useTransition, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  LeaderboardSettings,
  DEFAULT_LEADERBOARD_SETTINGS,
} from "@/lib/leaderboard-settings";
import { updateLeaderboardSettings } from "@/lib/actions/leaderboard-settings";
import { RealtimeLeaderboard } from "@/components/overlay/RealtimeLeaderboard";
import { RotateCcw, Save, Monitor } from "lucide-react";

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

interface LeaderboardSettingsFormProps {
  initialSettings: LeaderboardSettings;
}

export function LeaderboardSettingsForm({
  initialSettings,
}: LeaderboardSettingsFormProps) {
  const [isPending, startTransition] = useTransition();

  const [bgColor, setBgColor] = useState(initialSettings.bg_color);
  const [titleColor, setTitleColor] = useState(initialSettings.title_color);
  const [textColor, setTextColor] = useState(initialSettings.text_color);
  const [rankColor, setRankColor] = useState(initialSettings.rank_color);

  const colorFields = [
    {
      label: "Background Color",
      value: bgColor,
      setter: setBgColor,
      key: "bg_color",
    },
    {
      label: "Title Color",
      value: titleColor,
      setter: setTitleColor,
      key: "title_color",
    },
    {
      label: "Text Color",
      value: textColor,
      setter: setTextColor,
      key: "text_color",
    },
    {
      label: "Rank Badge Color",
      value: rankColor,
      setter: setRankColor,
      key: "rank_color",
    },
  ];

  const liveSettings: LeaderboardSettings = {
    user_id: initialSettings.user_id,
    bg_color: bgColor,
    title_color: titleColor,
    text_color: textColor,
    rank_color: rankColor,
  };

  function handleResetDefaults() {
    setBgColor(DEFAULT_LEADERBOARD_SETTINGS.bg_color);
    setTitleColor(DEFAULT_LEADERBOARD_SETTINGS.title_color);
    setTextColor(DEFAULT_LEADERBOARD_SETTINGS.text_color);
    setRankColor(DEFAULT_LEADERBOARD_SETTINGS.rank_color);
  }

  function handleSave() {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("bg_color", bgColor);
      formData.append("title_color", titleColor);
      formData.append("text_color", textColor);
      formData.append("rank_color", rankColor);

      const result = await updateLeaderboardSettings(formData);

      if (result.success) {
        toast.success("Settings saved successfully!");
      } else {
        toast.error(result.error || "Failed to save settings.");
      }
    });
  }

  return (
    <div className="space-y-8">
      {/* Preview */}
      <div className="space-y-4">
        <h3 className="font-black text-lg px-2 flex items-center gap-2 text-black">
          <Monitor className="w-5 h-5" />
          Live Preview
        </h3>

        <div className="bg-zinc-100 border-[3px] border-black rounded-xl p-6 shadow-[6px_6px_0px_0px_#000] flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]" />
          <div className="relative z-10 w-full flex justify-center origin-center">
            <RealtimeLeaderboard
              initialData={[
                { rank: 1, donorName: "Sultan Andara", totalAmount: 500 },
                { rank: 2, donorName: "Crypto Whale", totalAmount: 100 },
                { rank: 3, donorName: "Supporter #1", totalAmount: 50 },
              ]}
              streamerId="preview"
              previewSettings={liveSettings}
            />
          </div>
          <p className="mt-8 text-xs font-bold text-black/40 font-mono text-center">
            This is how it will look on your stream.
            <br />
            Colors update instantly!
          </p>
        </div>
      </div>
      <div className="space-y-6">
        {/* Colors */}
        <div className="bg-white border-[3px] border-black rounded-xl p-6 space-y-5 shadow-[6px_6px_0px_0px_#000]">
          <h2 className="font-black text-lg text-black">Customize Colors</h2>

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
            Reset to Defaults
          </button>
        </div>

        {/* Save */}
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="w-full py-4 rounded-xl bg-[#C1E1C1] text-black border-[3px] border-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all font-black text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
        >
          <Save className="w-5 h-5" />
          {isPending ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
