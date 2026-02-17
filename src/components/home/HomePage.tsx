"use client";

import { useState, useEffect } from "react";
import { LoginModal } from "@/components/auth/LoginModal";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

import { motion, Variants } from "framer-motion";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Link } from "@/i18n/routing";
import { useRouter } from "next/navigation";
import {
  Zap,
  Shield,
  MonitorPlay,
  Coins,
  Heart,
  Trophy,
  Flag,
  Gem,
} from "lucide-react";
import { Marquee } from "@/components/ui/Marquee";

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

export function HomePage() {
  const t = useTranslations("HomePage");
  const router = useRouter();
  const [loginModalOpen, setLoginModalOpen] = useState(false);

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

  const featuresList = [
    {
      icon: Shield,
      title: t("features.easyLogin.title"),
      desc: t.rich("features.easyLogin.desc", {
        bold: (chunks) => (
          <span className="font-bold text-foreground">{chunks}</span>
        ),
      }),
    },
    {
      icon: Zap,
      title: t("features.lowFees.title"),
      desc: t.rich("features.lowFees.desc", {
        bold: (chunks) => (
          <span className="font-bold text-foreground">{chunks}</span>
        ),
      }),
    },
    {
      icon: MonitorPlay,
      title: t("features.instantOverlay.title"),
      desc: t.rich("features.instantOverlay.desc", {
        bold: (chunks) => (
          <span className="font-bold text-foreground">{chunks}</span>
        ),
      }),
    },
    {
      icon: Coins,
      title: t("features.usdcStablecoin.title"),
      desc: t.rich("features.usdcStablecoin.desc", {
        bold: (chunks) => (
          <span className="font-bold text-foreground">{chunks}</span>
        ),
      }),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white overflow-x-hidden relative">
      <div className="absolute top-4 right-4 z-50">
        <LanguageSwitcher />
      </div>

      {/* Top Announcement Banner */}
      <Marquee />

      {/* Hero Section */}
      <motion.section
        className="flex-1 flex flex-col items-center justify-center px-6 py-10 md:py-16"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Logo / Mascot */}
        <motion.div variants={itemVariants} className="mb-6">
          <Image
            src="/hero-mobile.webp"
            alt="SawerSui Hero"
            width={800}
            height={800}
            quality={100}
            priority
            className="w-full drop-shadow-lg object-contain block md:hidden"
          />
          <Image
            src="/hero.webp"
            alt="SawerSui Hero"
            width={1200}
            height={1200}
            quality={100}
            priority
            className="w-full md:w-[800px] drop-shadow-lg object-contain hidden md:block"
          />
        </motion.div>

        {/* Headline */}
        <motion.div
          variants={itemVariants}
          className="text-center max-w-2xl space-y-3"
        >
          <h1 className="text-3xl md:text-5xl font-extrabold text-foreground leading-tight tracking-tight">
            {t("hero.title")}{" "}
            <span className="text-primary">{t("hero.subtitle")}</span>
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
            {t("hero.description")}
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
            {t("hero.loginButton")}
          </button>
          <Link
            href="/docs"
            className="px-12 py-3.5 text-base font-bold rounded-md bg-white text-[#1a1a1a] border-[3px] border-[#2a2a2a] shadow-[4px_4px_0px_0px_#2a2a2a] hover:shadow-[2px_2px_0px_0px_#2a2a2a] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all text-center"
          >
            {t("hero.docsButton")}
          </Link>
        </motion.div>
      </motion.section>

      {/* Platform Features Section */}
      <motion.section
        className="px-6 py-10 md:py-16 bg-white"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={containerVariants}
      >
        <div className="max-w-6xl mx-auto">
          <motion.div variants={itemVariants} className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-black text-foreground mb-4 uppercase tracking-tight">
              {t("features.platform.title")}
            </h2>
            <p className="text-xl text-muted-foreground font-bold max-w-2xl mx-auto">
              {t("features.platform.subtitle")}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Heart,
                title: t("features.platform.donation.title"),
                desc: t.rich("features.platform.donation.desc", {
                  bold: (chunks) => (
                    <span className="font-black">{chunks}</span>
                  ),
                }),
                color: "bg-[#FFB7B2]", // Red/Pink
              },
              {
                icon: Trophy,
                title: t("features.platform.leaderboard.title"),
                desc: t.rich("features.platform.leaderboard.desc", {
                  bold: (chunks) => (
                    <span className="font-black">{chunks}</span>
                  ),
                }),
                color: "bg-[#FFE8A3]", // Yellow
              },
              {
                icon: Flag,
                title: t("features.platform.milestone.title"),
                desc: t.rich("features.platform.milestone.desc", {
                  bold: (chunks) => (
                    <span className="font-black">{chunks}</span>
                  ),
                }),
                color: "bg-[#C1E1C1]", // Green
              },
              {
                icon: Gem,
                title: t("features.platform.nft.title"),
                desc: t.rich("features.platform.nft.desc", {
                  bold: (chunks) => (
                    <span className="font-black">{chunks}</span>
                  ),
                }),
                color: "bg-[#AAC4FF]", // Blue
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                className={`${feature.color} border-[3px] border-black rounded-xl p-6 shadow-[6px_6px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[3px_3px_0px_0px_#000] transition-all flex flex-col items-center text-center h-full group`}
              >
                <div className="w-16 h-16 rounded-full bg-white border-[3px] border-black flex items-center justify-center mb-6 shadow-[3px_3px_0px_0px_#000] group-hover:scale-110 transition-transform">
                  <feature.icon className="w-8 h-8 text-black" />
                </div>
                <h3 className="font-black text-xl text-black mb-3 uppercase tracking-tight leading-tight">
                  {feature.title}
                </h3>
                <p className="text-sm font-bold text-black/70 leading-relaxed">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Why SawerSui Features Section */}
      <motion.section
        className="px-6 py-10 md:py-16 bg-zinc-50 border-t-[3px] border-black"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={containerVariants}
      >
        <div className="max-w-5xl mx-auto">
          <motion.div variants={itemVariants} className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-black text-foreground mb-4 uppercase tracking-tight">
              {t("features.title")}{" "}
              <span className="text-primary">{t("features.brand")}</span>?
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {featuresList.map((feature, i) => {
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
    </div>
  );
}
