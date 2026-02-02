// Navbar handled by layout
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { checkUserOnboarding, getWalletBalance } from "@/lib/actions/auth";
import { OnboardingModal } from "@/components/auth/OnboardingModal";
import { WalletAddressCopy } from "@/components/dashboard/WalletAddressCopy";
import { DashboardGreeting } from "@/components/dashboard/DashboardGreeting";
import { DashboardQuickActions } from "@/components/dashboard/DashboardQuickActions";
import {
  ArrowUpRight,
  Bell,
  Trophy,
} from "lucide-react";


export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
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
      .eq("id", session.user.id)
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

          {/* OBS Integration */}
          <div className="space-y-4">
             <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 px-1">
               <ArrowUpRight className="w-5 h-5 rotate-90" />
               <span className="text-sm font-bold tracking-wider uppercase">OBS Integration</span>
             </div>

             <div className="space-y-3">
                {[
                  { 
                    title: "Notification Overlay", 
                    desc: "Alert box when donation comes in",
                    icon: Bell,
                    color: "bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400",
                    href: "/dashboard/overlay"
                  },
                  { 
                    title: "Leaderboard Overlay", 
                    desc: "Top donor leaderboard",
                    icon: Trophy,
                    color: "bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
                    href: "/dashboard/leaderboard"
                  }
                ].map((item, i) => (
                  <Link 
                    key={i} 
                    href={item.href}
                    className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-100 dark:border-white/5 flex items-center justify-between group cursor-pointer hover:border-gray-200 dark:hover:border-white/10 transition-colors"
                  >
                     <div className="flex items-center gap-4">
                       <div className={`w-14 h-14 rounded-full ${item.color} flex items-center justify-center`}>
                         <item.icon className="w-7 h-7" />
                       </div>
                       <div>
                         <h3 className="font-bold text-base">{item.title}</h3>
                         <p className="text-xs text-gray-500">{item.desc}</p>
                       </div>
                     </div>
                     <ArrowUpRight className="w-6 h-6 text-gray-300 group-hover:text-gray-500 transition-colors" />
                  </Link>
                ))}
             </div>
          </div>

        </div>



      <OnboardingModal 
        open={onboardingStatus.needsOnboarding} 
        initialData={onboardingStatus.profile}
      />
    </>
  );
}
