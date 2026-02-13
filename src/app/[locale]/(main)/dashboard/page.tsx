import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { checkUserOnboarding, getWalletBalance } from "@/lib/actions/auth";
import { getDonations } from "@/lib/actions/donation";
import { OnboardingModal } from "@/components/auth/OnboardingModal";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  let walletAddress: string | null = null;
  let usdcBalance = "0.00";
  let onboardingStatus: {
    needsOnboarding: boolean;
    profile?: { display_name?: string; username?: string };
  } = { needsOnboarding: false };

  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("wallet_address, display_name, username")
      .eq("id", user.id)
      .single();

    if (profile) {
      walletAddress = profile.wallet_address;

      if (walletAddress) {
        usdcBalance = await getWalletBalance(walletAddress);
      }

      onboardingStatus = {
        needsOnboarding: !profile.username || !profile.display_name,
        profile: {
          display_name: profile.display_name || undefined,
          username: profile.username || undefined,
        },
      };
    } else {
      onboardingStatus = { needsOnboarding: true };
    }
  } catch (error) {
    console.error("Dashboard init error:", error);
    onboardingStatus = await checkUserOnboarding();
  }

  // Get recent donations for the activity feed (fetch 50 to get a decent total sum estimate or just for list)
  // Note: ideally we should have a getDonationStats(userId) for total calculation.
  // For now, let's fetch recent 100 to sum up.
  const { data: recentDonations } = await getDonations(user.id, 1, 100);

  const displayName = onboardingStatus.profile?.display_name || "Player";
  const username = onboardingStatus.profile?.username || "";

  // Calculate total donations (approximation based on recent 100 or utilize a proper aggregation query later)
  const totalDonations = recentDonations.reduce(
    (sum: number, d: { amount_net: number }) => sum + (d.amount_net || 0),
    0,
  );
  const lastDonation = recentDonations.length > 0 ? recentDonations[0] : null;

  return (
    <>
      <DashboardOverview
        displayName={displayName}
        username={username}
        usdcBalance={usdcBalance}
        totalDonations={totalDonations} // This might be under-reporting if > 100 donations.
        lastDonation={lastDonation}
        recentDonations={recentDonations.slice(0, 5)}
        walletAddress={walletAddress}
      />

      <OnboardingModal
        open={onboardingStatus.needsOnboarding}
        initialData={onboardingStatus.profile}
      />
    </>
  );
}
