import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { enokiFlow } from "@/lib/enoki/client";
import { GOOGLE_CLIENT_ID } from "@/lib/zklogin/constants";

export function useZkLogin() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const router = useRouter();
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;

    const initSession = async () => {
      try {
        if (
          window.location.hash.includes("id_token") ||
          window.location.search.includes("id_token")
        ) {
          await enokiFlow.handleAuthCallback();
          window.history.replaceState(null, "", window.location.pathname);
        }

        const session = await enokiFlow.getSession();

        if (session && session.jwt) {
          setIsAuthenticated(true);
          const keypair = await enokiFlow.getKeypair({ network: "testnet" });
          const address = keypair.toSuiAddress();
          setUserAddress(address);
        }
      } catch (error) {
        console.error("Enoki Session/Callback Error:", error);
      } finally {
        if (mounted.current) setIsLoading(false);
      }
    };

    initSession();

    return () => {
      mounted.current = false;
    };
  }, []);

  const login = async (redirectPath?: string) => {
    try {
      setIsLoading(true);

      // Store redirect path for callback
      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          "zk_redirect_path",
          redirectPath || "/dashboard",
        );
      }

      const url = await enokiFlow.createAuthorizationURL({
        provider: "google",
        clientId: GOOGLE_CLIENT_ID,
        redirectUrl: `${window.location.origin}/auth/callback`,
        network: "testnet",
        extraParams: {
          scope: ["openid", "email", "profile"],
        },
      });
      window.location.href = url;
    } catch (error) {
      console.error("Login Error:", error);
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await enokiFlow.logout();
      setIsAuthenticated(false);
      setUserAddress(null);
      router.push("/");
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  const loginToSupabase = async () => {
    try {
      const keypair = await enokiFlow.getKeypair({ network: "testnet" });
      const address = keypair.toSuiAddress();

      // Timestamp for nonce
      const nonce = Date.now().toString();
      const message = `Login to SawerSui. Nonce: ${nonce}`;
      const messageBytes = new TextEncoder().encode(message);

      const { signature } = await keypair.signPersonalMessage(messageBytes);

      // Dynamically import server action
      const { verifyWalletLogin } = await import("@/lib/actions/auth");

      const result = await verifyWalletLogin(address, signature, message);
      return result;
    } catch (e) {
      console.error("Supabase Login Failed:", e);
      return { success: false, error: "Failed to sign in to Supabase" };
    }
  };

  return {
    login,
    logout,
    loginToSupabase,
    isLoading,
    isAuthenticated,
    userAddress,
  };
}
