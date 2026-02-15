import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { ArrowLeft, History } from "lucide-react";
import { MilestoneList } from "@/components/dashboard/MilestoneList";

export default async function MilestoneListPage() {
  // const t = await getTranslations("OBS.milestone_list");
  const tAction = await getTranslations("Action");
  const t = await getTranslations("Milestone.history");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors w-fit border-b-2 border-transparent hover:border-black"
        >
          <ArrowLeft className="w-4 h-4" />
          {tAction("backToDashboard")}
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-foreground flex items-center gap-2">
            <History className="w-6 h-6 sm:w-8 sm:h-8" />
            {t("title")}
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1">
            {t("subtitle")}
          </p>
        </div>
      </div>

      <div className="bg-zinc-50 border-[3px] border-black rounded-xl p-4 sm:p-6 shadow-[6px_6px_0px_0px_#000]">
        <MilestoneList />
      </div>
    </div>
  );
}
