import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/components/theme/ThemeProvider";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Github, Twitter } from "lucide-react";

interface AboutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AboutModal({ open, onOpenChange }: AboutModalProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const modalTitle = "ABOUT SAWERSUI";

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
                  Next Gen Donation Platform
                </p>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4 text-center">
                <p className={`text-sm leading-relaxed font-[family-name:var(--font-pixel-body)] ${isDark ? "text-gray-300" : "text-gray-600"}`}>
                  SawerSui is a decentralized livestream donation platform built on the <span className={isDark ? "text-white font-bold" : "text-black font-bold"}>Sui Network</span>.
                </p>
                <p className={`text-sm leading-relaxed font-[family-name:var(--font-pixel-body)] ${isDark ? "text-gray-300" : "text-gray-600"}`}>
                  Empower content creators with instant, low-fee transactions. No intermediaries, just direct support from fans to creators.
                </p>

                <div className={`mt-2 p-3 rounded-lg text-xs font-medium border ${isDark ? "bg-zinc-900 border-zinc-800 text-gray-400" : "bg-gray-50 border-gray-200 text-gray-600"}`}>
                   <p>
                     <span className="font-bold">Note:</span> A 5% platform fee is applied to every transaction to support development and dedicated ongoing maintenance.
                   </p>
                </div>

                <div className="pt-4 flex justify-center gap-4">
                    <a href="#" className={`p-2 rounded-full transition-colors ${isDark ? "hover:bg-white/10 text-white" : "hover:bg-black/5 text-black"}`}>
                        <Twitter className="w-5 h-5" />
                    </a>
                    <a href="#" className={`p-2 rounded-full transition-colors ${isDark ? "hover:bg-white/10 text-white" : "hover:bg-black/5 text-black"}`}>
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
