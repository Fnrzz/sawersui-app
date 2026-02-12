import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Github, Twitter } from "lucide-react";

interface AboutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AboutModal({ open, onOpenChange }: AboutModalProps) {
  const t = useTranslations("Modals.About");
  return (
    <AnimatePresence>
      {open && (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-transparent border-none shadow-none">
            <DialogTitle className="sr-only">{t("title")}</DialogTitle>

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="w-full relative overflow-hidden rounded-2xl border bg-white border-border shadow-xl"
            >
              {/* Header */}
              <div className="p-6 text-center border-b border-border bg-amber-50">
                <h2 className="text-lg font-extrabold text-foreground uppercase tracking-wide mb-1">
                  {t("title")}
                </h2>
                <p className="text-xs text-muted-foreground">{t("subtitle")}</p>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4 text-center">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t.rich("desc1", {
                    bold: (chunks) => (
                      <span className="text-foreground font-bold">
                        {chunks}
                      </span>
                    ),
                  })}
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t("desc2")}
                </p>

                <div className="mt-2 p-3 rounded-xl text-xs font-medium border bg-muted border-border text-muted-foreground">
                  <p>
                    {t.rich("note", {
                      bold: (chunks) => (
                        <span className="font-bold text-foreground">
                          {chunks}
                        </span>
                      ),
                    })}
                  </p>
                </div>

                <div className="pt-4 flex justify-center gap-4">
                  <a
                    href="#"
                    className="p-2 rounded-full transition-colors hover:bg-muted text-foreground"
                  >
                    <Twitter className="w-5 h-5" />
                  </a>
                  <a
                    href="#"
                    className="p-2 rounded-full transition-colors hover:bg-muted text-foreground"
                  >
                    <Github className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
}
