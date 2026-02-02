
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Trophy, ArrowLeft, Monitor } from "lucide-react";
import Link from "next/link";
import { headers } from "next/headers";
import { Metadata } from 'next';
import { UrlCopy } from "@/components/dashboard/UrlCopy";
import { RealtimeLeaderboard } from "@/components/overlay/RealtimeLeaderboard";

export const metadata: Metadata = {
  title: 'Leaderboard Setup | SawerBase Dashboard',
  description: 'Setup your leaderboard overlay'
};

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect("/");
  }

  // Fetch verified wallet address from profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("wallet_address")
    .eq("id", session.user.id)
    .single();

  if (!profile?.wallet_address) {
     return (
       <div className="p-8 text-center">
         <p className="text-red-500">Error: Wallet address not found. Please reconnect.</p>
       </div>
     );
  }

  // No need to fetch real data for the preview, we use dummy data to show how it looks

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
          href="/dashboard"
          className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-xl font-bold font-[family-name:var(--font-pixel)]">LEADERBOARD SETUP</h1>
        </div>
      </div>

      {/* URL Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-white/5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-lg">Leaderboard URL</h2>
            <p className="text-xs text-gray-500">Copy this link to OBS</p>
          </div>
        </div>

        <UrlCopy url={overlayUrl} />
        
        <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/20 text-xs text-red-600 dark:text-red-400">
          ⚠️ <strong>Keep this URL private!</strong> Anyone with this link can trigger alerts on your stream.
        </div>
      </div>

      {/* Design Preview */}
      <div className="space-y-4">
        <h3 className="font-bold text-lg px-2 flex items-center gap-2">
           <Monitor className="w-5 h-5" />
           Design Preview
        </h3>
        
        <div className="bg-zinc-100 dark:bg-zinc-900/50 rounded-3xl p-6 border border-gray-200 dark:border-white/5 flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden">
            {/* Checkerboard background for transparency simulation */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]" />
            
            <div className="relative z-10 w-full flex justify-center origin-center">
               <RealtimeLeaderboard 
                 initialData={[
                   { rank: 1, donorName: "Sultan Andara", totalAmount: 500 },
                   { rank: 2, donorName: "Crypto Whale", totalAmount: 100 },
                   { rank: 3, donorName: "Anonymous", totalAmount: 50 },
                   { rank: 4, donorName: "Supporter #1", totalAmount: 10 },
                   { rank: 5, donorName: "Fan", totalAmount: 5 },
                 ]} 
                 streamerId="preview" 
               />
            </div>
            <p className="mt-8 text-xs text-gray-400 font-mono">
                Actual rendering on stream
            </p>
        </div>
      </div>

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
               desc: "In OBS, click the '+' icon under Sources and select 'Browser'." 
             },
             { 
               step: 2, 
               title: "Paste URL", 
               desc: "Paste your unique Leaderboard URL into the 'URL' field." 
             },
             { 
               step: 3, 
               title: "Set Dimensions", 
               desc: "We recommend width 320px and height 400px, but you can adjust as needed." 
             },
             { 
               step: 4, 
               title: "Test It", 
               desc: "It will update automatically when you receive donations!" 
             }
           ].map((item) => (
             <div key={item.step} className="flex gap-4">
               <div className="w-8 h-8 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-bold font-mono text-sm shrink-0">
                 {item.step}
               </div>
               <div>
                 <h4 className="font-bold text-sm mb-1">{item.title}</h4>
                 <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
               </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
}
