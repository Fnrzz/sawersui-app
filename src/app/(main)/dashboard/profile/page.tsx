import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { WalletAddressCopy } from "@/components/dashboard/WalletAddressCopy";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

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
    return (
      <div className="text-center text-muted-foreground py-12">
        Profil tidak ditemukan
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">Profil</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Informasi akun kamu
          </p>
        </div>
      </div>

      <div className="bg-white border border-border rounded-2xl p-6 space-y-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-amber-50 border-2 border-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
            {(profile.display_name || "U").charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="font-bold text-lg text-foreground">
              {profile.display_name}
            </h2>
            <p className="text-sm text-muted-foreground">@{profile.username}</p>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
            Alamat Wallet
          </label>
          <WalletAddressCopy address={profile.wallet_address} />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
            Email
          </label>
          <p className="text-sm font-medium text-foreground">
            {user.email || "—"}
          </p>
        </div>
      </div>
    </div>
  );
}
