"use client";

import { useState, useEffect } from "react";
import { Play } from "lucide-react";
import { LoginModal } from "@/components/auth/LoginModal";
import { AboutModal } from "@/components/home/AboutModal";

import { useTheme } from "@/components/theme/ThemeProvider";
// Navbar handled by layout
import { motion, Variants } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function HomePage() {
  const router = useRouter();
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [aboutModalOpen, setAboutModalOpen] = useState(false);
  
  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace("/dashboard");
      }
    };
    checkUser();
  }, [router]);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" }
    },
  };

  return (
    <>
      <motion.div 
        className="flex-1 flex flex-col items-center justify-center p-8 pb-20 sm:p-20 relative z-10"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="max-w-md w-full text-center space-y-12">
          
          {/* Logo Section */}
          <motion.div variants={itemVariants}>
            <div className="relative w-40 h-40 mx-auto drop-shadow-2xl">
              <video
                src="/animation.webm"
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-contain"
              />
            </div>
            
            <div className="space-y-3">
              <motion.h1 variants={itemVariants} className={`font-[family-name:var(--font-pixel)] text-base tracking-wider ${isDark ? 'text-white' : 'text-black'}`}>
                SAWERSUI
              </motion.h1>
              <div className={`h-1 w-12 mx-auto ${isDark ? 'bg-white' : 'bg-black'}`} />
              <motion.p variants={itemVariants} className={`font-[family-name:var(--font-pixel-body)] text-xl ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                Next Gen Donation Platform
              </motion.p>
              
              <motion.div variants={itemVariants} className="pt-2">
                <span className={`inline-flex items-center px-2.5 py-1 rounded text-[10px] font-[family-name:var(--font-pixel)] tracking-widest uppercase border ${
                  isDark 
                    ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' 
                    : 'bg-yellow-600/10 text-yellow-600 border-yellow-600/20'
                }`}>
                  BETA TESTNET
                </span>
              </motion.div>
            </div>
          </motion.div>

          {/* Buttons Section */}
          <div className="space-y-4">
            {/* CTA Button */}
            <motion.button
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setLoginModalOpen(true)}
              className={`group relative w-full px-8 py-4 font-[family-name:var(--font-pixel)] text-xs tracking-widest uppercase transition-all duration-300 ${
                isDark 
                  ? 'bg-white text-black hover:bg-zinc-200' 
                  : 'bg-black text-white hover:bg-zinc-800'
              }`}
            >
              <span className="relative z-10 flex items-center justify-center gap-3">
                START NOW
                <Play className="w-3 h-3 fill-current" />
              </span>
              
              {/* Retro Shadow Effect */}
              <div className={`absolute inset-0 translate-x-1.5 translate-y-1.5 -z-10 transition-transform group-hover:translate-x-2 group-hover:translate-y-2 ${
                isDark ? 'bg-white/20' : 'bg-black/20'
              }`} />
            </motion.button>

          </div>

        </div>
      </motion.div>

      {/* Footer */}
      <motion.footer 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="w-full px-5 pb-8 pt-4 space-y-4 relative z-10 flex flex-col items-center"
      >
        {/* About Button */}
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setAboutModalOpen(true)}
            className={`py-2 font-[family-name:var(--font-pixel)] text-[10px] tracking-widest uppercase transition-colors ${
            isDark 
                ? 'text-white/80 hover:text-white' 
                : 'text-black/80 hover:text-black'
            }`}
        >
            WHAT IS THIS?
        </motion.button>

        <div className={`flex items-center justify-center gap-2 text-[10px] font-[family-name:var(--font-pixel)] tracking-widest opacity-80 uppercase ${isDark ? 'text-white' : 'text-black'}`}>
          <Play className="w-4 h-4 fill-current animate-pulse" />
          <span>Press Start to Begin</span>
          <Play className="w-4 h-4 fill-current animate-pulse rotate-180" />
        </div>
        
        <p className={`font-[family-name:var(--font-pixel-body)] text-sm text-center animate-pulse ${isDark ? 'text-white/70' : 'text-black/70'}`}>
          Powered by Sui Network
        </p>
      </motion.footer>

      <LoginModal open={loginModalOpen} onOpenChange={setLoginModalOpen} />
      <AboutModal open={aboutModalOpen} onOpenChange={setAboutModalOpen} />
    </>
  );
}
