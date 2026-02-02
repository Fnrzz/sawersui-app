"use client";

import { motion } from "framer-motion";

export function DashboardGreeting({ displayName }: { displayName: string }) {
  return (
    <div className="space-y-1">
      <h1 className="text-3xl font-bold flex items-center gap-2">
        Hello, {displayName} 
        <motion.span 
          animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }}
          transition={{ 
            duration: 2.5, 
            repeat: Infinity, 
            repeatDelay: 1,
            ease: "easeInOut"
          }}
          style={{ originX: 0.7, originY: 0.7, display: "inline-block" }}
        >
          👋
        </motion.span>
      </h1>
      <motion.p 
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-base text-gray-500 dark:text-gray-400"
      >
        Ready to receive donations today?
      </motion.p>
    </div>
  );
}
