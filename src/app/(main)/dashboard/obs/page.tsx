"use client";

import Link from "next/link";
import { ArrowUpRight, Bell, Trophy, ArrowLeft } from "lucide-react";
import { MenuCard } from "@/components/dashboard/MenuCard";

export default function OBSSettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">
            Pengaturan OBS
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Konfigurasi overlay untuk streaming kamu
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Notifikasi Overlay - Cyan */}
        <MenuCard
          title="Notifikasi Overlay"
          description="Alert box real-time saat ada donasi masuk. Wajib dipasang!"
          icon={Bell}
          colorClass="bg-[#BAE6FD]" // Cyan-200ish
          href="/dashboard/obs/overlay"
        />

        {/* Leaderboard Overlay - Orange */}
        <MenuCard
          title="Leaderboard Overlay"
          description="Tampilkan klasemen pendukung terbanyak di stream kamu."
          icon={Trophy}
          colorClass="bg-[#FED7AA]" // Orange-200ish
          href="/dashboard/obs/leaderboard"
        />
      </div>
    </div>
  );
}
