"use client";

import { notFound } from "next/navigation";
import { DonationForm } from "@/components/donation/DonationForm";
// Navbar handled by layout
import { motion, Variants } from "framer-motion";
import { useState } from "react";
import { LoginModal } from "@/components/auth/LoginModal";

// ============================================================
// TYPES
// ============================================================

interface DonationPageProps {
  streamer: {
    id: string;
    username: string;
    display_name: string;
    wallet_address: string;
  };
}

// Animation Variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};




// ============================================================
// CLIENT COMPONENT
// ============================================================

export function DonationPageClient({ streamer }: DonationPageProps) {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  if (!streamer) {
    notFound();
  }

  return (
    <>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex-1 flex flex-col h-full bg-white dark:bg-zinc-950 overflow-hidden"
      >
        <DonationForm
          streamer={streamer}
          onLoginClick={() => setIsLoginModalOpen(true)}
        />
      </motion.div>
      
      <LoginModal 
        open={isLoginModalOpen} 
        onOpenChange={setIsLoginModalOpen} 
        redirectTo={`/${streamer.username}`} 
      />
    </>
  );
}
