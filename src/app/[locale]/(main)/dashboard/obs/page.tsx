"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { Bell, Trophy, ArrowLeft, Flag } from "lucide-react";
import { MenuCard } from "@/components/dashboard/MenuCard";

export default function OBSSettingsPage() {
  const t = useTranslations("OBS");
  const tAction = useTranslations("Action");
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
          <h1 className="text-2xl font-extrabold text-foreground">
            {t("title")}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{t("subtitle")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Notifikasi Overlay - Cyan */}
        <MenuCard
          title={t("overlay.title")}
          description={t("overlay.desc")}
          icon={Bell}
          colorClass="bg-[#BAE6FD]" // Cyan-200ish
          href="/dashboard/obs/overlay"
        />

        {/* Leaderboard Overlay - Orange */}
        <MenuCard
          title={t("leaderboard.title")}
          description={t("leaderboard.desc")}
          icon={Trophy}
          colorClass="bg-[#FED7AA]" // Orange-200ish
          href="/dashboard/obs/leaderboard"
        />

        {/* Milestone Overlay - Lime */}
        <MenuCard
          title={t("milestone.title")}
          description={t("milestone.desc")}
          icon={Flag}
          colorClass="bg-[#BEF264]" // Lime-200ish
          href="/dashboard/obs/milestone"
        />
      </div>
    </div>
  );
}
