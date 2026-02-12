import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { getDonations } from "@/lib/actions/donation";
import { formatDistanceToNow } from "date-fns";
import { Clock, History, ExternalLink, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface HistoryPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function HistoryPage({ searchParams }: HistoryPageProps) {
  const t = await getTranslations("History");
  const tAction = await getTranslations("Action");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const resolvedParams = await searchParams;
  const page =
    typeof resolvedParams.page === "string" ? parseInt(resolvedParams.page) : 1;
  const limit = 6;
  const { data: donations, total } = await getDonations(user.id, page, limit);
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          {tAction("backToDashboard")}
        </Link>
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-extrabold text-foreground">
              {t("title")}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {t("subtitle", { total })}
            </p>
          </div>
          <span className="text-sm font-medium bg-muted px-3 py-1 rounded-md">
            {t("page", { current: page, total: totalPages || 1 })}
          </span>
        </div>
      </div>

      <div className="bg-transparent min-h-[500px] flex flex-col justify-between">
        {donations.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground bg-white border border-border rounded-2xl shadow-sm">
            <History className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">{t("empty")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {donations.map((donation, i) => {
              const bgColors = [
                "bg-[#FFE8A3]", // Yellow
                "bg-[#C1E1C1]", // Green
                "bg-[#FFB7B2]", // Red/Pink
                "bg-[#AAC4FF]", // Blue
                "bg-[#FBCFE8]", // Pink
                "bg-[#BAE6FD]", // Cyan
              ];
              const color = bgColors[i % bgColors.length];

              return (
                <div
                  key={donation.id}
                  className={`${color} border-[3px] border-black rounded-xl p-6 shadow-[6px_6px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[3px_3px_0px_0px_#000] transition-all flex flex-col justify-between h-full`}
                >
                  <div className="space-y-4">
                    {/* Header: Name & Time */}
                    <div className="flex justify-between items-start">
                      <div className="bg-white/50 px-3 py-1 rounded-lg border-2 border-black inline-block">
                        <span className="font-black text-black text-sm">
                          {donation.donor_name || "Anonim"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-bold text-black/60 bg-white/30 px-2 py-1 rounded-md border border-black/10">
                        <Clock className="w-3 h-3" />
                        <span>
                          {formatDistanceToNow(new Date(donation.created_at), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Message */}
                    <div className="bg-white/40 p-3 rounded-lg border-2 border-black/20 min-h-[80px]">
                      {donation.message ? (
                        <p className="text-sm font-medium text-black leading-relaxed italic">
                          &quot;{donation.message}&quot;
                        </p>
                      ) : (
                        <p className="text-xs text-black/40 italic text-center py-4">
                          {t("noMessage")}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Footer: Amount & Link */}
                  <div className="mt-6 pt-4 border-t-2 border-black/10 flex justify-between items-end">
                    <div>
                      <p className="text-xs font-bold text-black/60 uppercase tracking-wider mb-0.5">
                        {t("amount")}
                      </p>
                      <p className="text-2xl font-black text-black">
                        ${donation.amount_net.toFixed(2)}
                      </p>
                    </div>
                    <a
                      href={`https://suiscan.xyz/testnet/tx/${donation.tx_digest}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                      title={tAction("viewTransaction")}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-8 pt-4">
            <Link
              href={`/dashboard/history?page=${page - 1}`}
              className={`px-4 py-2 rounded-lg font-bold border-2 border-black transition-all ${
                page <= 1
                  ? "opacity-50 cursor-not-allowed bg-gray-200 text-gray-400 pointer-events-none"
                  : "bg-white text-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000]"
              }`}
              aria-disabled={page <= 1}
            >
              {t("previous")}
            </Link>
            <span className="font-bold text-lg">
              {page} / {totalPages}
            </span>
            <Link
              href={`/dashboard/history?page=${page + 1}`}
              className={`px-4 py-2 rounded-lg font-bold border-2 border-black transition-all ${
                page >= totalPages
                  ? "opacity-50 cursor-not-allowed bg-gray-200 text-gray-400 pointer-events-none"
                  : "bg-white text-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000]"
              }`}
              aria-disabled={page >= totalPages}
            >
              {t("next")}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
