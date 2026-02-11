"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSuiNSName } from "@/hooks/useSuiNSName";

interface WalletAddressCopyProps {
  address: string | null;
}

export function WalletAddressCopy({ address }: WalletAddressCopyProps) {
  const [copied, setCopied] = useState(false);
  const { name: suiNSName } = useSuiNSName(address);

  const handleCopy = async () => {
    if (!address) return;
    
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy address:", err);
    }
  };

  return (
    <div 
      onClick={handleCopy}
      className="flex items-center gap-2 w-full pr-4 cursor-pointer hover:opacity-70 transition-opacity"
      role="button"
      title="Click to copy address"
    >
      <div className="flex flex-col">
        {suiNSName && (
          <span className="text-xs text-blue-500 dark:text-blue-400 font-medium">
            {suiNSName}
          </span>
        )}
        <code className="text-md text-gray-500 dark:text-gray-400 font-mono">
          {address
            ? `${address.slice(0, 20)}...${address.slice(-4)}`
            : "Generating..."
          }
        </code>
      </div>
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <motion.div
            key="check"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
          >
            <Check className="w-4 h-4 text-green-500" />
          </motion.div>
        ) : (
          <motion.div
            key="copy"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
          >
            <Copy className="w-4 h-4 text-gray-400" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
