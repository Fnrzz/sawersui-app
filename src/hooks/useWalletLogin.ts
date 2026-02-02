import { useState, useCallback, useEffect } from "react";
import { useCurrentAccount, useSignPersonalMessage } from "@mysten/dapp-kit";
import { useRouter } from "next/navigation";
import { verifyWalletLogin } from "@/lib/actions/auth";

interface UseWalletLoginOptions {
  redirectTo?: string;
  onSuccess?: () => void;
}

export function useWalletLogin(enableAutoLogin: boolean = false, options: UseWalletLoginOptions = {}) {
  const { redirectTo = "/dashboard", onSuccess } = options;
  
  const [isSigning, setIsSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const currentAccount = useCurrentAccount();
  const { mutate: signPersonalMessage } = useSignPersonalMessage();
  const router = useRouter();

  const handleSignAndLogin = useCallback(async () => {
    if (!currentAccount || isSigning) return;

    setIsSigning(true);
    setError(null);
    
    try {
      const nonce = Date.now();
      const message = `Login to SawerSui. Nonce: ${nonce}`;
      const messageBytes = new TextEncoder().encode(message);

      signPersonalMessage(
        {
          message: messageBytes,
        },
        {
          onSuccess: async (result) => {
            try {
              const response = await verifyWalletLogin(
                currentAccount.address,
                result.signature,
                message
              );

              if (response.success) {
                console.log("Login success!", response);
                
                // If external handler exists, let it handle navigation/UI
                if (onSuccess) {
                  onSuccess();
                } else {
                  // Default behavior: Refresh and redirect
                  router.refresh(); 
                  router.push(redirectTo);
                }
              } else {
                const errMsg = response.error || "Verification failed";
                console.error("Login verification failed:", errMsg);
                setError(errMsg);
                setIsSigning(false);
              }
            } catch (err: unknown) {
              const errMsg = err instanceof Error ? err.message : "An internal error occurred during verification.";
              console.error("Server verification error:", err);
              setError(errMsg);
              setIsSigning(false);
            }
          },
          onError: (err) => {
            console.error("Signing failed:", err);
            setError("Signature rejected or failed");
            setIsSigning(false);
          },
        }
      );
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("An unexpected error occurred");
      setIsSigning(false);
    }
  }, [currentAccount, isSigning, signPersonalMessage, router, redirectTo, onSuccess]);

  // Auto-trigger effect
  useEffect(() => {
    if (enableAutoLogin && currentAccount && !isSigning && !error) {
      // Small timeout to prevent race conditions or immediate double-call
      const timer = setTimeout(() => {
        handleSignAndLogin();
      }, 500); 
      return () => clearTimeout(timer);
    }
  }, [currentAccount, enableAutoLogin, handleSignAndLogin, isSigning, error]);

  return {
    isSigning,
    error,
    handleSignAndLogin
  };
}
