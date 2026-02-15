"use client";

import { notFound } from "next/navigation";
import { DonationForm } from "@/components/donation/DonationForm";
import { motion, Variants } from "framer-motion";
import { useState } from "react";
import { LoginModal } from "@/components/auth/LoginModal";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

import { OverlaySettings } from "@/lib/overlay-settings";

interface DonationPageProps {
  streamer: {
    id: string;
    username: string;
    display_name: string;
    wallet_address: string;
  };
  settings: OverlaySettings;
}

const containerVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

export function DonationPageClient({ streamer, settings }: DonationPageProps) {
  const t = useTranslations("DonationPage");
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  if (!streamer) {
    notFound();
  }

  return (
    <>
      <div className="min-h-screen flex flex-col bg-[#FEFCE8] font-sans">
        {/* Helper Nav specific for donation page */}
        <div className="absolute top-4 right-4 z-50">
          <LanguageSwitcher />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-start px-4 pb-20 pt-16">
          {/* Profile Section (Outside Card) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center mb-8 text-center max-w-lg"
          >
            <div className="relative mb-4">
              <div className="w-24 h-24 rounded-full overflow-hidden border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white">
                {/* Placeholder AVATAR if no image, using first letter */}
                <div className="w-full h-full flex items-center justify-center bg-gray-200 text-3xl font-black">
                  {streamer.display_name.charAt(0).toUpperCase()}
                </div>
              </div>
            </div>

            <h1 className="text-3xl font-black text-black mb-1">
              {streamer.display_name}
            </h1>

            <p className="text-sm font-bold text-black/80 leading-relaxed max-w-md">
              {t("defaultDescription")}
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="w-full max-w-xl"
          >
            <div className="bg-white border-[3px] border-black rounded-lg p-6 md:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative z-10">
              <DonationForm
                streamer={streamer}
                settings={settings}
                onLoginClick={() => setIsLoginModalOpen(true)}
              />
            </div>
          </motion.div>
        </div>
      </div>

      <LoginModal
        open={isLoginModalOpen}
        onOpenChange={setIsLoginModalOpen}
        redirectTo={`/${streamer.username}`}
      />
    </>
  );
}
