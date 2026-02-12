"use client";

import { useState, useEffect } from "react";
import { LoginModal } from "@/components/auth/LoginModal";
import { AboutModal } from "@/components/home/AboutModal";

import { motion, Variants } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Zap, Shield, MonitorPlay, Coins } from "lucide-react";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

const features = [
  {
    icon: Shield,
    title: "Easy Login",
    desc: "Login dengan Google atau connect wallet. Tanpa install app, tanpa ribet.",
  },
  {
    icon: Zap,
    title: "Low Fees",
    desc: "Gas fee disponsori. Donasi sampai ke kreator tanpa potongan besar.",
  },
  {
    icon: MonitorPlay,
    title: "Instant Overlay",
    desc: "Notifikasi donasi langsung muncul di OBS kamu secara real-time.",
  },
  {
    icon: Coins,
    title: "USDC Stablecoin",
    desc: "Donasi pakai USDC — stabil, aman, dan bisa di-withdraw kapan saja.",
  },
];

export function HomePage() {
  const router = useRouter();
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [aboutModalOpen, setAboutModalOpen] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        router.replace("/dashboard");
      }
    };
    checkUser();
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Top Announcement Banner */}
      <div className="sawer-banner text-white py-2 overflow-hidden">
        <div className="animate-scroll-left whitespace-nowrap flex">
          <span className="text-sm font-medium px-8">
            🎉 SawerSui — Platform donasi Web3 pertama di Sui Network! Dukung
            streamer favoritmu dengan USDC. Gas fee disponsori!
          </span>
          <span className="text-sm font-medium px-8">
            🎉 SawerSui — Platform donasi Web3 pertama di Sui Network! Dukung
            streamer favoritmu dengan USDC. Gas fee disponsori!
          </span>
        </div>
      </div>

      {/* Hero Section */}
      <motion.section
        className="flex-1 flex flex-col items-center justify-center px-6 py-10 md:py-16"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Logo / Mascot */}
        <motion.div variants={itemVariants} className="mb-4">
          <video
            src="/animation.webm"
            autoPlay
            loop
            muted
            playsInline
            className="w-32 h-32 md:w-40 md:h-40 drop-shadow-lg"
          />
        </motion.div>

        {/* Headline */}
        <motion.div
          variants={itemVariants}
          className="text-center max-w-2xl space-y-3"
        >
          <h1 className="text-3xl md:text-5xl font-extrabold text-foreground leading-tight tracking-tight">
            Jembatan interaksi dengan{" "}
            <span className="text-primary">penontonmu!</span>
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Platform donasi Web3 di Sui Network untuk para streamer dan kreator
            konten Indonesia.
          </p>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6"
        >
          <button
            onClick={() => setLoginModalOpen(true)}
            className="px-12 py-3.5 text-base font-bold rounded-md bg-[#F5A623] text-[#1a1a1a] border-[3px] border-[#2a2a2a] shadow-[4px_4px_0px_0px_#2a2a2a] hover:shadow-[2px_2px_0px_0px_#2a2a2a] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all"
          >
            Masuk / Daftar
          </button>
          <button
            onClick={() => setAboutModalOpen(true)}
            className="px-12 py-3.5 text-base font-bold rounded-md bg-white text-[#1a1a1a] border-[3px] border-[#2a2a2a] shadow-[4px_4px_0px_0px_#2a2a2a] hover:shadow-[2px_2px_0px_0px_#2a2a2a] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all"
          >
            About
          </button>
        </motion.div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        className="px-6 py-10 md:py-12"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={containerVariants}
      >
        <div className="max-w-5xl mx-auto">
          <motion.h2
            variants={itemVariants}
            className="text-2xl md:text-3xl font-extrabold text-center mb-8"
          >
            Kenapa <span className="text-primary">SawerSui</span>?
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((feature, i) => {
              const colors = [
                "bg-[#FFE8A3]", // Yellow
                "bg-[#C1E1C1]", // Green
                "bg-[#FFB7B2]", // Red/Pink
                "bg-[#AAC4FF]", // Blue
              ];
              const color = colors[i % colors.length];

              return (
                <motion.div
                  key={i}
                  variants={itemVariants}
                  className={`${color} border-[3px] border-[#2a2a2a] rounded-xl p-6 shadow-[4px_4px_0px_0px_#2a2a2a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#2a2a2a] transition-all cursor-default`}
                >
                  <div className="w-12 h-12 rounded-lg bg-white/50 border-2 border-[#2a2a2a] flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-[#2a2a2a]" />
                  </div>
                  <h3 className="font-bold text-lg text-[#1a1a1a] mb-2 leading-tight">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-[#1a1a1a]/80 leading-relaxed font-medium">
                    {feature.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.section>

      <LoginModal open={loginModalOpen} onOpenChange={setLoginModalOpen} />
      <AboutModal open={aboutModalOpen} onOpenChange={setAboutModalOpen} />
    </div>
  );
}
