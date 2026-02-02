"use client";

import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface OverlayCopyButtonProps {
  path: string;
  icon?: React.ComponentType<{ className?: string }>;
  color?: string;
  title: string;
  desc: string;
}

export function OverlayCopyButton({ path, icon: Icon, color, title, desc }: OverlayCopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const fullUrl = `${window.location.origin}${path}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    toast.success("Overlay URL copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      onClick={handleCopy}
      className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-100 dark:border-white/5 flex items-center justify-between group cursor-pointer hover:border-gray-200 dark:hover:border-white/10 transition-colors"
    >
      <div className="flex items-center gap-4">
        <div className={`w-14 h-14 rounded-full ${color} flex items-center justify-center`}>
          {Icon && <Icon className="w-7 h-7" />}
        </div>
        <div>
          <h3 className="font-bold text-base">{title}</h3>
          <p className="text-xs text-gray-500">{desc}</p>
        </div>
      </div>
      {copied ? (
        <Check className="w-6 h-6 text-green-500 transition-colors" />
      ) : (
        <Copy className="w-6 h-6 text-gray-300 group-hover:text-gray-500 transition-colors" />
      )}
    </div>
  );
}
