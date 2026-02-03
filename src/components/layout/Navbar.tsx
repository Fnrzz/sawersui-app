"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Sun, Moon, LogOut } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";
import { useDisconnectWallet, useCurrentAccount } from "@mysten/dapp-kit";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import { useZkLogin } from "@/hooks/useZkLogin";

interface NavbarProps {
  user?: User | null;
}

export function Navbar({ user }: NavbarProps) {
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const isDark = theme === "dark";
  
  const { mutate: disconnect } = useDisconnectWallet();
  const currentAccount = useCurrentAccount();
  
  // ZkLogin Hook
  const { logout: zkLogout, isAuthenticated: isZkAuthenticated } = useZkLogin();

  // Check for Supabase session on client side
  const [sessionUser, setSessionUser] = useState<User | null>(null);
  
  // Track explicit logout
  const [hasLoggedOut, setHasLoggedOut] = useState(false);
  
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setSessionUser(data.user);
    });
  }, []);

  const isClientLoggedIn = !!(currentAccount || sessionUser || isZkAuthenticated);
  const isLoggedIn = isClientLoggedIn || (!!user && !hasLoggedOut);

  const handleLogout = async () => {
    setHasLoggedOut(true);

    if (currentAccount) disconnect();

    const supabase = createClient();
    await supabase.auth.signOut();
    
    // Call Enoki Logout
    await zkLogout();
    
    setSessionUser(null);
    
    // Clear obsolete cookies/storage just in case
    document.cookie = "zklogin_address=; path=/; max-age=0";
    localStorage.removeItem("zklogin_session");
    
    router.refresh();
  };

  return (
    <header className="w-full px-4 py-3 flex items-center justify-between relative z-10 border-b-2 bg-transparent">
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push("/")}>
        <Image
          src="/logo2.webp"
          alt="SawerSui Logo"
          width={40}
          height={40}
          priority
          className="w-10 h-10 hover:rotate-12 transition-transform duration-300"
          style={{ imageRendering: 'pixelated' }}
        />
        <span className={`font-[family-name:var(--font-pixel)] text-[10px] tracking-wider ${isDark ? 'text-white' : 'text-black'}`}>
          SAWERSUI
        </span>
      </div>

      <div className="flex items-center gap-3">
        {isLoggedIn && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleLogout}
              className={`px-3 py-2 text-[10px] font-[family-name:var(--font-pixel)] border-2 rounded-lg flex items-center gap-2 transition-all hover:scale-105 ${
                isDark 
                  ? 'border-white text-white hover:bg-white hover:text-black' 
                  : 'border-black text-black hover:bg-black hover:text-white'
              }`}
            >
              <LogOut className="w-3 h-3" />
            </button>
          </div>
        )}
        
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className={`w-10 h-10 flex items-center justify-center transition-all active:translate-y-0.5 hover:rotate-180 duration-300 ${
            isDark ? 'text-white' : 'text-black'
          }`}
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>
    </header>
  );
}
