import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { ArrowLeft, Monitor, Bell } from "lucide-react";
import CreateMilestoneForm from "@/components/dashboard/CreateMilestoneForm";
import { RealtimeMilestone } from "@/components/overlay/RealtimeMilestone";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { UrlCopy } from "@/components/dashboard/UrlCopy";

export default async function MilestoneSettingsPage() {
  const t = await getTranslations("OBS.milestone");

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

  // Determine host for full URL
  const headersList = await headers();
  const host = headersList.get("host") || "sawersui.com";
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const overlayUrl = `${protocol}://${host}/overlay/${profile.wallet_address}/milestone`;

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
        <h1 className="text-xl font-bold font-[family-name:var(--font-pixel)] uppercase">
          {t("title")}
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <div className="space-y-6">
          {/* 1. URL Card */}
          <div className="bg-white border-[3px] border-black rounded-xl p-6 shadow-[6px_6px_0px_0px_#000] space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg border-2 border-black bg-[#BEF264] flex items-center justify-center text-black">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-black text-lg text-black">
                  Milestone Overlay URL
                </h2>
                <p className="text-xs font-bold text-black/60">
                  Copy this link to OBS Browser Source
                </p>
              </div>
            </div>

            <UrlCopy url={overlayUrl} />

            <div className="p-3 bg-red-100 rounded-lg border-2 border-black text-xs font-bold text-black">
              ⚠️ <strong>Keep this URL private!</strong> Anyone with this link
              can trigger alerts on your stream.
            </div>
          </div>

          {/* 2. Live Preview */}
          <div className="space-y-4">
            <h3 className="font-black text-lg px-2 flex items-center gap-2 text-black">
              <Monitor className="w-5 h-5" />
              Live Preview
            </h3>

            <div className="bg-zinc-100 border-[3px] border-black rounded-xl p-6 shadow-[6px_6px_0px_0px_#000] flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]" />
              <div className="relative z-10">
                <RealtimeMilestone streamerId={user.id} preview={true} />
              </div>
            </div>
            <p className="text-xs text-gray-500 font-bold px-2">
              * This is a preview with dummy data. The real overlay will show
              your active milestone.
            </p>
          </div>
        </div>

        {/* 3. Creation Form (Right Column) */}
        <div>
          <CreateMilestoneForm />
        </div>
      </div>
    </div>
  );
}
