"use client";

import { useZkLogin } from "@/hooks/useZkLogin";
import { useTranslations } from "next-intl";
import Image from "next/image";

interface LoginWithGoogleButtonProps {
  redirectTo?: string;
}

export function LoginWithGoogleButton({
  redirectTo,
}: LoginWithGoogleButtonProps) {
  const t = useTranslations("Modals.Login");
  const { login, isLoading } = useZkLogin();

  return (
    <button
      onClick={() => login(redirectTo)}
      disabled={isLoading}
      className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-white border-2 border-border text-foreground hover:bg-muted active:scale-[0.99]"
    >
      {isLoading ? (
        <span className="animate-pulse text-muted-foreground">
          Redirecting...
        </span>
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
          <span>{t("googleLogin")}</span>
        </>
      )}
    </button>
  );
}
