"use client";

import { Link, usePathname } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const useDocsNavItems = () => {
  const t = useTranslations("DocsSidebar");

  return [
    {
      title: t("Sections.Introduction"),
      items: [
        { title: t("Links.About"), href: "/docs" },
        { title: t("Links.GettingStarted"), href: "/docs/getting-started" },
      ],
    },
    {
      title: t("Sections.Platform"),
      items: [
        { title: t("Links.Donations"), href: "/docs/donations" },
        { title: t("Links.Milestones"), href: "/docs/milestones" },
        { title: t("Links.Leaderboard"), href: "/docs/leaderboard" },
      ],
    },
    {
      title: t("Sections.Resources"),
      items: [
        { title: t("Links.FAQ"), href: "/docs/faq" },
        { title: t("Links.Terms"), href: "/docs/terms" },
      ],
    },
  ];
};

interface DocsNavContentProps {
  onLinkClick?: () => void;
}

function DocsNavContent({ onLinkClick }: DocsNavContentProps) {
  const pathname = usePathname();
  const t = useTranslations("DocsSidebar");
  const navItems = useDocsNavItems();

  return (
    <div className="h-full overflow-y-auto py-6 pr-6 pl-4">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center text-sm font-medium text-[#606770] hover:text-primary transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("BackToHome")}
        </Link>
        <LanguageSwitcher />
      </div>
      {navItems.map((section, index) => (
        <div key={index} className="mb-8">
          <h4 className="mb-2 rounded-md px-2 py-1 text-sm font-bold text-[#1C1E21] uppercase tracking-wider">
            {section.title}
          </h4>
          <div className="grid grid-flow-row auto-rows-max text-sm">
            {section.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onLinkClick}
                className={cn(
                  "group flex w-full items-center rounded-md border border-transparent px-2 py-1.5 hover:bg-[#EAEAEA] hover:text-primary",
                  pathname === item.href
                    ? "font-bold text-primary bg-white border-[#E5E7EB] shadow-sm"
                    : "text-[#606770]",
                )}
              >
                {item.title}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function DocsSidebar() {
  return (
    <aside className="fixed top-0 z-30 hidden h-screen w-full shrink-0 md:sticky md:block md:w-64 border-r border-[#E5E7EB] bg-[#F7F7F7]">
      <DocsNavContent />
    </aside>
  );
}

export function MobileDocsSidebar() {
  const [open, setOpen] = useState(false);
  const t = useTranslations("Modals.Docs");

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="md:hidden mr-4 p-2 text-muted-foreground hover:text-foreground">
          <Menu className="w-6 h-6" />
          <span className="sr-only">Toggle Menu</span>
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[400px] p-0">
        <SheetHeader className="px-6 pt-6">
          <SheetTitle className="text-left text-primary font-extrabold">
            {t("title")}
          </SheetTitle>
        </SheetHeader>
        <DocsNavContent onLinkClick={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
