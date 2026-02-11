import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getDonations } from "@/lib/actions/donation";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, Clock, History } from "lucide-react";
import Link from "next/link";

export default async function HistoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const donations = await getDonations(user.id);

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <Link href="/dashboard" className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-xl font-bold font-[family-name:var(--font-pixel)]">
          DONATION HISTORY
        </h1>
      </div>



      {/* History List */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden border border-gray-100 dark:border-white/5 shadow-sm">
        <div className="p-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
           <div className="flex items-center gap-2 text-sm font-bold text-gray-500">
             <History className="w-4 h-4" />
             Recent Transactions
           </div>
        </div>

        {donations.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p>No donations yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-white/5">
            {donations.map((donation) => (
              <div key={donation.id} className="p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-900 dark:text-white truncate">
                      {donation.donor_name || "Anonymous"}
                    </h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-bold">
                       Successful
                    </span>
                  </div>
                  {donation.message && (
                    <p className="text-sm text-gray-500 truncate mb-1">
                      &quot;{donation.message}&quot;
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(donation.created_at), { addSuffix: true })}
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-lg font-black font-[family-name:var(--font-pixel)] text-green-600 dark:text-green-400">
                    +{donation.amount_net} USDC
                  </p>
                  <div className="flex flex-col items-end gap-0.5">
                    <a
                      href={`https://suiscan.xyz/testnet/tx/${donation.tx_digest}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-500 hover:underline"
                    >
                      View on Explorer
                    </a>
                    {donation.walrus_blob_id && (
                      <a
                        href={`${process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR_URL || "https://aggregator.walrus-testnet.walrus.space"}/v1/blobs/${donation.walrus_blob_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-green-500 hover:underline"
                      >
                        View Receipt
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
