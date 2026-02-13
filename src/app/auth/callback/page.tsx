"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useZkLogin } from "@/hooks/useZkLogin";
import { OnboardingModal } from "@/components/auth/OnboardingModal";

export default function CallbackPage() {
  const router = useRouter();
  // useZkLogin hook automatically handles the Enoki callback on mount via EnokiFlow.handleAuthCallback()
  const { isAuthenticated, isLoading, userAddress, loginToSupabase } =
    useZkLogin();
  const [showRegistration, setShowRegistration] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Wait for all checks to complete
    if (!isLoading && isAuthenticated) {
      if (userAddress) {
        // Sync Supabase Session
        const syncSession = async () => {
          if (isSyncing) return;
          setIsSyncing(true);
          console.log("Enoki Login Successful. Syncing Supabase Session...");

          const result = await loginToSupabase();

          if (result.success) {
            if (result.needsOnboarding) {
              console.log("User needs registration. Showing modal.");
              setShowRegistration(true);
            } else {
              const redirectPath =
                sessionStorage.getItem("zk_redirect_path") || "/dashboard";
              router.push(redirectPath);
            }
          } else {
            console.error("Failed to sync session:", result.error);
            // Maybe show error or force registration logic?
            // For now, redirect anyway and let dashboard handle (it will redirect back to home)
            router.push("/?error=session_sync_failed");
          }
        };

        syncSession();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isAuthenticated, userAddress, router]); // remove isSyncing from deps to prevent loops

  if (showRegistration && userAddress) {
    return (
      <OnboardingModal
        open={true}
        address={userAddress}
        onSuccess={() => {
          const redirectPath =
            sessionStorage.getItem("zk_redirect_path") || "/dashboard";
          router.push(redirectPath);
        }}
      />
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
        <p className="font-[family-name:var(--font-pixel)] text-sm animate-pulse text-center whitespace-nowrap">
          AUTHENTICATING WITH <br /> ENOKI...
        </p>
      </div>
    </div>
  );
}
