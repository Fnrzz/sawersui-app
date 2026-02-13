"use client";

import { useTranslations } from "next-intl";

interface MarqueeProps {
  className?: string;
  text?: string;
}

export function Marquee({ className, text }: MarqueeProps) {
  const t = useTranslations("HomePage");
  const content = text || t("banner");

  return (
    <div
      className={`sawer-banner text-white py-2 overflow-hidden ${className}`}
    >
      <div className="animate-scroll-left whitespace-nowrap flex">
        <span className="text-sm font-medium px-8">{content}</span>
        <span className="text-sm font-medium px-8">{content}</span>
        <span className="text-sm font-medium px-8">{content}</span>
        <span className="text-sm font-medium px-8">{content}</span>
        <span className="text-sm font-medium px-8">{content}</span>
        <span className="text-sm font-medium px-8">{content}</span>
      </div>
    </div>
  );
}
