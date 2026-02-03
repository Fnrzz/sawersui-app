"use client";

import { useZkLogin } from "@/hooks/useZkLogin";
import { useTheme } from "@/components/theme/ThemeProvider";
import Image from "next/image";

interface LoginWithGoogleButtonProps {
  redirectTo?: string;
}

export function LoginWithGoogleButton({ redirectTo }: LoginWithGoogleButtonProps) {
  const { login, isLoading } = useZkLogin();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={() => login(redirectTo)}
      disabled={isLoading}
      className={`w-full py-4 rounded-lg font-[family-name:var(--font-pixel)] text-xs tracking-wider uppercase flex items-center justify-center gap-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden active:scale-[0.99] border-2 ${
        isDark
          ? "bg-transparent border-white/20 text-white hover:bg-white/10"
          : "bg-transparent border-black/10 text-black hover:bg-black/5"
      }`}
    >
      {isLoading ? (
         <span className="animate-pulse">REDIRECTING...</span>
      ) : (
        <>
          <div className="w-5 h-5 relative shrink-0">
             <Image 
               src="https://www.svgrepo.com/show/475656/google-color.svg" 
               alt="Google"
               fill
               className="object-contain"
             />
          </div>
          <span>LOGIN WITH GOOGLE</span>
        </>
      )}
    </button>
  );
}
