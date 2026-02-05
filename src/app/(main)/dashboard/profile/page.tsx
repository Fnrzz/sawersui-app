import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ArrowLeft, User, LogOut } from "lucide-react";
import Link from "next/link";
import { WalletAddressCopy } from "@/components/dashboard/WalletAddressCopy";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return <div>Profile not found</div>;
  }

  return (
    <div className="p-4 space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <Link
          href="/dashboard"
          className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-xl font-bold font-[family-name:var(--font-pixel)]">
            PROFILE
          </h1>
        </div>
      </div>

      <div className="space-y-4">
        {/* User Info Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-white/5 space-y-6">
          <div>
            <h2 className="font-bold text-lg">{profile.display_name}</h2>
            <p className="text-sm text-gray-500">@{profile.username}</p>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-500 uppercase tracking-wider font-bold ml-1">
              Wallet Address
            </label>
            <WalletAddressCopy address={profile.wallet_address} />
          </div>
        </div>
      </div>
    </div>
  );
}
