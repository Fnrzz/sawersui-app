import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getOverlaySettings } from "@/lib/actions/settings";
import { UrlCopy } from "@/components/dashboard/UrlCopy";
import { SettingsForm } from "@/components/dashboard/SettingsForm";
import { ArrowLeft, Bell, Monitor } from "lucide-react";
import Link from "next/link";
import { headers } from "next/headers";

export default async function OverlayTutorialPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  // Fetch verified wallet address from profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("wallet_address")
    .eq("id", user.id)
    .single();

  if (!profile?.wallet_address) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500">
          Error: Wallet address not found. Please reconnect.
        </p>
      </div>
    );
  }

  // Fetch overlay settings
  const settings = await getOverlaySettings(user.id);

  // Determine host for full URL
  const headersList = await headers();
  const host = headersList.get("host") || "sawersui.com";
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const overlayUrl = `${protocol}://${host}/overlay/${profile.wallet_address}`;

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <Link
          href="/dashboard/obs"
          className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-xl font-bold font-[family-name:var(--font-pixel)]">
          OVERLAY SETUP
        </h1>
      </div>

      {/* URL Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-white/5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center text-orange-600 dark:text-orange-400">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-lg">Notification URL</h2>
            <p className="text-xs text-gray-500">Copy this link to OBS</p>
          </div>
        </div>

        <UrlCopy url={overlayUrl} />

        <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/20 text-xs text-red-600 dark:text-red-400">
          ⚠️ <strong>Keep this URL private!</strong> Anyone with this link can
          trigger alerts on your stream.
        </div>
      </div>

      {/* Overlay Settings (Colors + Sound + Live Preview) */}
      <SettingsForm initialSettings={settings} />

      {/* Instructions */}
      <div className="space-y-4">
        <h3 className="font-bold text-lg px-2 flex items-center gap-2">
          <Monitor className="w-5 h-5" />
          Setup Instructions
        </h3>

        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-white/5 space-y-6">
          {[
            {
              step: 1,
              title: "Add Browser Source",
              desc: "In OBS, click the '+' icon under Sources and select 'Browser'.",
            },
            {
              step: 2,
              title: "Paste URL",
              desc: "Paste your unique Notification URL into the 'URL' field.",
            },
            {
              step: 3,
              title: "Set Dimensions",
              desc: "Set width to 1920 and height to 1080 (or your canvas size).",
            },
            {
              step: 4,
              title: "Test It",
              desc: "Send a test donation or ask a viewer to tip you!",
            },
          ].map((item) => (
            <div key={item.step} className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-bold font-mono text-sm shrink-0">
                {item.step}
              </div>
              <div>
                <h4 className="font-bold text-sm mb-1">{item.title}</h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
