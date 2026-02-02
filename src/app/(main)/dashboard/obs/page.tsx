
import Link from "next/link";
import { ArrowUpRight, Bell, Trophy, ArrowLeft } from "lucide-react";

export default function OBSSettingsPage() {
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
          <h1 className="text-xl font-bold font-[family-name:var(--font-pixel)]">OBS SETTINGS</h1>
        </div>
      </div>

      <div className="space-y-4">
         <div className="space-y-3">
            {[
              { 
                title: "Notification Overlay", 
                desc: "Alert box when donation comes in",
                icon: Bell,
                color: "bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400",
                href: "/dashboard/obs/overlay"
              },
              { 
                title: "Leaderboard Overlay", 
                desc: "Top donor leaderboard",
                icon: Trophy,
                color: "bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
                href: "/dashboard/obs/leaderboard"
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
  );
}
