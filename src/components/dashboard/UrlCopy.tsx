"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface UrlCopyProps {
  url: string;
}

export function UrlCopy({ url }: UrlCopyProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!url) return;
    
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy URL:", err);
    }
  };

  return (
    <div className="flex items-center gap-2 w-full bg-gray-50 dark:bg-white/5 p-3 rounded-xl border border-gray-200 dark:border-white/10">
      <div className="flex-1 overflow-hidden">
        <p className="text-xs text-gray-500 font-mono truncate">
          {url}
        </p>
      </div>
      
      <button 
        onClick={handleCopy}
        className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
        title="Copy URL"
      >
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
      </button>
    </div>
  );
}
