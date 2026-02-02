import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/components/theme/ThemeProvider";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import { useWalletLogin } from "@/hooks/useWalletLogin"; 

// ============================================================
// TYPES
// ============================================================

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  redirectTo?: string;
}

// ============================================================
// COMPONENT
// ============================================================

export function LoginModal({ 
  open, 
  onOpenChange,
  redirectTo = "/dashboard"
}: LoginModalProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const router = useRouter();
  const currentAccount = useCurrentAccount();

  // Wallet Login Hook
  const { handleSignAndLogin, isSigning, error } = useWalletLogin(true, {
    onSuccess: () => {
      onOpenChange(false);
      router.refresh();
      if (redirectTo) {
        router.push(redirectTo);
      }
    }
  });

  const modalTitle = "CONNECT WALLET";
  const modalSubtitle = "Connect wallet to donate or login";

  return (
    <AnimatePresence>
      {open && (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-transparent border-none shadow-none">
            <DialogTitle className="sr-only">
              {modalTitle}
            </DialogTitle>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className={`w-full relative overflow-hidden rounded-2xl border ${
                isDark 
                  ? "bg-black border-white/20 shadow-[0_0_50px_-12px_rgba(255,255,255,0.1)]" 
                  : "bg-white border-black/10 shadow-xl"
              }`}
            >
              {/* Header */}
              <div className={`p-6 text-center border-b ${isDark ? "border-white/10" : "border-black/5"}`}>
                <h2 className={`font-[family-name:var(--font-pixel)] text-lg tracking-widest uppercase mb-2 ${
                  isDark ? "text-white" : "text-black"
                }`}>
                  {modalTitle}
                </h2>
                <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                  {modalSubtitle}
                </p>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Wallet Login Button - Connects then Signs */}
                {currentAccount ? (
                  <button
                    onClick={handleSignAndLogin}
                    disabled={isSigning}
                    className={`w-full py-4 rounded-lg font-[family-name:var(--font-pixel)] text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      isDark
                        ? "bg-zinc-900 border border-white/10 text-white hover:bg-zinc-800"
                        : "bg-white border border-black/10 text-black hover:bg-gray-50"
                    }`}
                  >
                    {isSigning ? "Signing..." : "Sign In with Wallet"}
                  </button>
                ) : (
                  <ConnectButton 
                    className="w-full"
                    connectText="Connect Wallet"
                    style={{ 
                      width: "100%", 
                      justifyContent: "center",
                      height: "48px",
                      borderRadius: "0.5rem",
                      fontFamily: "var(--font-pixel)",
                      textTransform: "uppercase",
                      fontSize: "0.75rem",
                      letterSpacing: "0.05em"
                    }}
                  />
                )}

                {error && (
                  <p className="text-xs text-red-500 text-center mt-2">
                    {error}
                  </p>
                )}
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
}
