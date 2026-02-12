"use client";

import { LucideIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface MenuCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  colorClass: string; // e.g., "bg-cyan-200"
  href?: string;
  onClick?: () => void;
  className?: string;
  actionLabel?: string;
}

export function MenuCard({
  title,
  description,
  icon: Icon,
  colorClass,
  href,
  onClick,
  className,
  actionLabel,
}: MenuCardProps) {
  const content = (
    <div
      className={cn(
        "relative group overflow-hidden border-[3px] border-black rounded-xl p-6 shadow-[6px_6px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[3px_3px_0px_0px_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all h-full flex flex-col justify-between",
        colorClass,
        className,
      )}
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl md:text-2xl font-black text-black leading-tight">
          {title}
        </h3>
        <div className="bg-white/50 p-3 rounded-lg border-2 border-black">
          <Icon className="w-6 h-6 md:w-8 md:h-8 text-black" />
        </div>
      </div>

      <p className="text-sm md:text-base font-medium text-black/80 mb-6 leading-relaxed">
        {description}
      </p>

      {actionLabel && (
        <div className="self-start px-4 py-2 bg-black text-white font-bold text-sm rounded-lg group-hover:bg-gray-800 transition-colors">
          {actionLabel}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full">
        {content}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className="block w-full text-left h-full">
      {content}
    </button>
  );
}
