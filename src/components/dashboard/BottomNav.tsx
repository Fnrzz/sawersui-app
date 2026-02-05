"use client";

import { Home, History, Settings, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { icon: Home, label: "Home", href: "/dashboard", exact: true },
    {
      icon: Settings,
      label: "OBS Setting",
      href: "/dashboard/obs",
      exact: false,
    },
    {
      icon: History,
      label: "History",
      href: "/dashboard/history",
      exact: false,
    },
    { icon: User, label: "Profile", href: "/dashboard/profile", exact: false },
  ];

  return (
    <nav className="h-24 bg-white dark:bg-black border-t border-gray-100 dark:border-white/5 flex items-center justify-around px-4 absolute bottom-0 w-full z-20 pb-4">
      {navItems.map((item, i) => {
        const isActive = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);

        return (
          <Link
            key={i}
            href={item.href}
            className={`flex flex-col items-center gap-2 p-2 transition-colors ${
              isActive
                ? "text-black dark:text-white"
                : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            }`}
          >
            <item.icon className={`w-7 h-7 `} />
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
