import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import { useWalletLogin } from "@/hooks/useWalletLogin";
import { LoginWithGoogleButton } from "@/components/auth/LoginWithGoogleButton";

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  redirectTo?: string;
}

export function LoginModal({
  open,
  onOpenChange,
  redirectTo = "/dashboard",
}: LoginModalProps) {
  const t = useTranslations("Modals.Login");
  const router = useRouter();
  const currentAccount = useCurrentAccount();

  const { handleSignAndLogin, isSigning, error } = useWalletLogin(true, {
    onSuccess: () => {
      onOpenChange(false);
      router.refresh();
      if (redirectTo) {
        router.push(redirectTo);
      }
    },
  });

  return (
    <AnimatePresence>
      {open && (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-transparent border-none shadow-none">
            <DialogTitle className="sr-only">{t("connectWallet")}</DialogTitle>

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="w-full relative overflow-hidden rounded-2xl border bg-white border-border shadow-xl"
            >
              {/* Header */}
              <div className="p-6 text-center border-b border-border bg-amber-50">
                <h2 className="text-lg font-extrabold text-foreground mb-1">
                  {t("title")}
                </h2>
                <p className="text-xs text-muted-foreground">{t("subtitle")}</p>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Wallet Login */}
                {currentAccount ? (
                  <button
                    onClick={handleSignAndLogin}
                    disabled={isSigning}
                    className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-muted border border-border text-foreground hover:bg-muted/80"
                  >
                    {isSigning ? t("signing") : t("signInWallet")}
                  </button>
                ) : (
                  <ConnectButton
                    className="w-full"
                    connectText={t("connectWallet")}
                    style={{
                      width: "100%",
                      justifyContent: "center",
                      height: "48px",
                      borderRadius: "0.75rem",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                    }}
                  />
                )}

                {/* Divider */}
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="px-3 bg-white text-muted-foreground text-xs font-medium">
                      {t("or")}
                    </span>
                  </div>
                </div>

                <LoginWithGoogleButton redirectTo={redirectTo} />

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
