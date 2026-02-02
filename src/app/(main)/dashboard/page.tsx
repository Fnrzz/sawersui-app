// Navbar handled by layout
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

import { checkUserOnboarding, getWalletBalance } from "@/lib/actions/auth";
import { OnboardingModal } from "@/components/auth/OnboardingModal";
import { WalletAddressCopy } from "@/components/dashboard/WalletAddressCopy";
import { DashboardGreeting } from "@/components/dashboard/DashboardGreeting";
import { DashboardQuickActions } from "@/components/dashboard/DashboardQuickActions";



export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  let walletAddress: string | null = null;
  let usdcBalance = "0.00";
  let onboardingStatus: { needsOnboarding: boolean; profile?: { display_name?: string; username?: string } } = { needsOnboarding: false };

  try {
    // Fetch profile directly - wallet address is stored during signup
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
        profile: { display_name: profile.display_name || undefined, username: profile.username || undefined }
      };
    } else {
      onboardingStatus = { needsOnboarding: true };
    }
  } catch (error) {
    console.error("Dashboard init error:", error);
    onboardingStatus = await checkUserOnboarding();
  }

  const displayName = onboardingStatus.profile?.display_name || "Player";

  return (
    <>
      {/* Scrollable Content */}
    <div className="p-4 space-y-4">


        {/* Greeting Section */}
        <DashboardGreeting displayName={displayName} />


          {/* Balance Card */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-white/5 relative overflow-hidden group">
             <div className="relative z-10 space-y-4">
               <div>
                 <p className="text-base text-gray-500 dark:text-gray-400 mb-1">Your USDC Balance</p>
                 <div className="flex items-baseline gap-2">
                   <span className="text-5xl font-black tracking-tight">{usdcBalance}</span>
                   <span className="text-xl font-bold text-gray-500">USDC</span>
                 </div>
               </div>

                <WalletAddressCopy address={walletAddress} />
             </div>
          </div>

          {/* Quick Actions */}
          <DashboardQuickActions username={onboardingStatus.profile?.username || ""} />

          {/* OBS Integration - Moved to /dashboard/obs */}

        </div>



      <OnboardingModal 
        open={onboardingStatus.needsOnboarding} 
        initialData={onboardingStatus.profile}
      />
    </>
  );
}
