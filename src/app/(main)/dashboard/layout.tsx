"use client";

import Link from "next/link";
import Image from "next/image";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-5xl mx-auto p-4 md:p-6 lg:p-8">
        <header className="flex items-center justify-between mb-8">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image
              src="/logo2.webp"
              alt="SawerSui"
              width={32}
              height={32}
              className="w-8 h-8"
            />
            <span className="font-bold text-lg text-foreground">sawersui</span>
          </Link>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}
