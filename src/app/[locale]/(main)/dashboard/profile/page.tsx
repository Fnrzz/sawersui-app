import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { WalletAddressCopy } from "@/components/dashboard/WalletAddressCopy";
import Link from "next/link";
import { ArrowLeft, Trophy } from "lucide-react";
import { getOwnedMilestoneNfts } from "@/lib/nft";
import { NftCard } from "@/components/dashboard/NftCard";

export default async function ProfilePage() {
  const t = await getTranslations("Profile");
  const tAction = await getTranslations("Action");
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
        {t("notFound")}
      </div>
    );
  }

  // Fetch NFTs
  const nfts = await getOwnedMilestoneNfts(profile.wallet_address);

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors w-fit border-b-2 border-transparent hover:border-black"
        >
          <ArrowLeft className="w-4 h-4" />
          {tAction("backToDashboard")}
        </Link>
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter text-foreground drop-shadow-[2px_2px_0px_rgba(0,0,0,0.2)]">
            {t("title")}
          </h1>
          <p className="text-muted-foreground font-medium mt-1">
            {t("subtitle")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Left Column: Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white border-[3px] border-black rounded-xl p-6 space-y-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sticky top-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-24 h-24 rounded-full bg-[#FFDF20] border-[3px] border-black flex items-center justify-center text-4xl font-black text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                {(profile.display_name || "U").charAt(0).toUpperCase()}
              </div>
              <div className="space-y-1">
                <h2 className="font-black text-2xl text-foreground uppercase tracking-tight">
                  {profile.display_name}
                </h2>
                <div className="inline-block bg-black text-white text-xs font-bold px-2 py-0.5 rounded-sm">
                  @{profile.username}
                </div>
              </div>
            </div>

            <div className="h-0.5 w-full bg-black/10 dashed-border" />

            <div className="space-y-1">
              <label className="text-xs font-black uppercase tracking-wider text-black/60">
                {t("walletAddress")}
              </label>
              <div className="p-1 border-[2px] border-black rounded bg-zinc-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <WalletAddressCopy address={profile.wallet_address} />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black uppercase tracking-wider text-black/60">
                {t("email")}
              </label>
              <p className="text-sm font-bold text-foreground break-all bg-zinc-50 border-[2px] border-black rounded p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                {user.email || "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: NFT Gallery */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-3 border-b-[3px] border-black pb-2">
            <Trophy className="w-6 h-6" />
            <h2 className="text-2xl font-black uppercase tracking-tighter">
              My Awards ({nfts.length})
            </h2>
          </div>

          {nfts.length === 0 ? (
            <div className="bg-zinc-100 border-[3px] border-black border-dashed rounded-xl p-12 text-center text-muted-foreground">
              <p className="font-bold text-lg">No awards collected yet.</p>
              <p className="text-sm mt-2">
                Create and complete milestones to earn exclusive NFTs!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {nfts.map((nft) => (
                <NftCard
                  key={nft.objectId}
                  imageUrl={nft.imageUrl}
                  name={nft.name}
                  objectId={nft.objectId}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
