"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Sun, Moon, LogOut } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";
import { useDisconnectWallet, useCurrentAccount } from "@mysten/dapp-kit";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";

interface NavbarProps {
  user?: User | null;
}

export function Navbar({ user }: NavbarProps) {
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const isDark = theme === "dark";
  
  const { mutate: disconnect } = useDisconnectWallet();
  const currentAccount = useCurrentAccount();
  
  // Check for Supabase session on client side (for email login users)
  const [sessionUser, setSessionUser] = useState<User | null>(null);
  
  // Track explicit logout action to ignore server state during transition
  const [hasLoggedOut, setHasLoggedOut] = useState(false);
  
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setSessionUser(data.user);
    });
  }, []);

  // Show logout if any auth method is active AND we haven't just cleared it locally
  // We reset hasLoggedOut automatically if currentAccount or sessionUser becomes truthy 
  // because the button will show regardless of 'hasLoggedOut' if those are true.
  // The only case 'hasLoggedOut' matters is if 'user' (server) is true but we want to simulate logout.
  // So we don't need to manually reset 'hasLoggedOut' strictly, as long as isLoggedIn logic is correct.
  
  // However, to be clean, we can just check:
  const isClientLoggedIn = !!(currentAccount || sessionUser);
  
  // If we have a client login, we are logged in.
  // If not, we fall back to server user, UNLESS we explicitly logged out.
  const isLoggedIn = isClientLoggedIn || (!!user && !hasLoggedOut);

  const handleLogout = async () => {
    setHasLoggedOut(true); // Ignore server user state immediately

    // 1. Disconnect wallet if connected
    if (currentAccount) {
       disconnect();
    }

    // 2. Sign out from Supabase
    const supabase = createClient();
    await supabase.auth.signOut();
    
    // 3. Clear local state immediately
    setSessionUser(null);
    
    router.refresh();
    router.push("/");
  };

  return (
    <header className="w-full px-4 py-3 flex items-center justify-between relative z-10 border-b-2 bg-transparent">
      <div className="flex items-center gap-3">
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
        {/* Show logout if any auth method is active */}
        {isLoggedIn && (
           <button
             onClick={handleLogout}
             className={`px-3 py-2 text-[10px] font-[family-name:var(--font-pixel)] border-2 rounded-lg flex items-center gap-2 transition-all active:translate-y-0.5 hover:scale-105 ${
               isDark 
                 ? 'border-white text-white hover:bg-white hover:text-black' 
                 : 'border-black text-black hover:bg-black hover:text-white'
             }`}
           >
             <LogOut className="w-3 h-3" />
             LOGOUT
           </button>
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
