import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Trophy, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { headers } from "next/headers";
import { Metadata } from "next";
import { UrlCopy } from "@/components/dashboard/UrlCopy";
import { getLeaderboardSettings } from "@/lib/actions/leaderboard-settings";
import { LeaderboardSettingsForm } from "@/components/dashboard/LeaderboardSettingsForm";

export const metadata: Metadata = {
  title: "Leaderboard Setup | SawerBase Dashboard",
  description: "Setup your leaderboard overlay",
};

export default async function LeaderboardPage() {
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

  // Fetch existing settings
  const settings = await getLeaderboardSettings(user.id);

  // Determine host for full URL
  const headersList = await headers();
  const host = headersList.get("host") || "sawersui.com";
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const overlayUrl = `${protocol}://${host}/overlay/${profile.wallet_address}/leaderboard`;

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
        <div>
          <h1 className="text-xl font-bold font-[family-name:var(--font-pixel)]">
            LEADERBOARD SETUP
          </h1>
        </div>
      </div>

      {/* URL Card */}
      <div className="bg-white border-[3px] border-black rounded-xl p-6 shadow-[6px_6px_0px_0px_#000] space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg border-2 border-black bg-blue-100 text-black flex items-center justify-center">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-black text-lg text-black">Leaderboard URL</h2>
            <p className="text-xs font-bold text-black/60">
              Copy this link to OBS
            </p>
          </div>
        </div>

        <UrlCopy url={overlayUrl} />

        <div className="p-3 bg-red-100 rounded-lg border-2 border-black text-xs font-bold text-black">
          ⚠️ <strong>Keep this URL private!</strong> Anyone with this link can
          trigger alerts on your stream.
        </div>
      </div>

      <LeaderboardSettingsForm initialSettings={settings} />

      {/* Instructions */}
      <div className="space-y-4 pt-4 border-t-2 border-black/5">
        <h3 className="font-black text-lg px-2 flex items-center gap-2 text-black">
          Instructions
        </h3>

        <div className="bg-white border-[3px] border-black rounded-xl p-6 shadow-[6px_6px_0px_0px_#000] space-y-6">
          {[
            {
              step: 1,
              title: "Add Browser Source",
              desc: "In OBS, click the '+' icon under Sources and select 'Browser'.",
            },
            {
              step: 2,
              title: "Paste URL",
              desc: "Paste your unique Leaderboard URL into the 'URL' field.",
            },
            {
              step: 3,
              title: "Set Dimensions",
              desc: "We recommend width 320px and height 400px, but you can adjust as needed.",
            },
            {
              step: 4,
              title: "Test It",
              desc: "It will update automatically when you receive donations!",
            },
          ].map((item) => (
            <div key={item.step} className="flex gap-4">
              <div className="w-8 h-8 rounded-lg border-2 border-black bg-black text-white flex items-center justify-center font-black font-mono text-sm shrink-0 shadow-[2px_2px_0px_0px_#000]">
                {item.step}
              </div>
              <div>
                <h4 className="font-black text-sm mb-1 text-black">
                  {item.title}
                </h4>
                <p className="text-xs font-medium text-black/70 leading-relaxed">
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
