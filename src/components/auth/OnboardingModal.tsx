"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProfile, registerEnokiUser } from "@/lib/actions/auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";

interface OnboardingModalProps {
  open: boolean;
  initialData?: {
    username?: string | null;
    display_name?: string | null;
  };
  address?: string; // If provided, we are registering a new Enoki user
  onSuccess?: () => void;
}

export function OnboardingModal({ open, initialData, address, onSuccess }: OnboardingModalProps) {
  const [username, setUsername] = useState(initialData?.username || "");
  const [displayName, setDisplayName] = useState(initialData?.display_name || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (address) {
        // Enoki Registration Mode
        const result = await registerEnokiUser(address, username, displayName);
        if (!result.success) {
            throw new Error(result.error || "Registration failed");
        }
        if (onSuccess) onSuccess();
      } else {
        // Standard Onboarding Mode (Update existing profile)
        await updateProfile(username, displayName);
      }
      
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className={`w-[calc(100%-32px)] max-w-sm mx-auto border-2 rounded-none p-0 overflow-hidden gap-0 ${
        isDark ? 'border-white bg-black' : 'border-black bg-white'
      }`}
      onInteractOutside={(e) => e.preventDefault()}
      onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className={`border-b-2 px-4 py-4 text-center ${isDark ? 'border-white/20' : 'border-black/20'}`}>
           <DialogHeader>
            <DialogTitle className={`font-[family-name:var(--font-pixel)] text-xs tracking-wider ${isDark ? 'text-white' : 'text-black'}`}>
              WELCOME PLAYER
            </DialogTitle>
             <DialogDescription className={`font-[family-name:var(--font-pixel-body)] text-xs mt-2 ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              Create your character profile
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="space-y-2">
            <label className={`block font-[family-name:var(--font-pixel)] text-[10px] uppercase ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              Username
            </label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              placeholder="username"
              className={`font-[family-name:var(--font-pixel-body)] rounded-none h-10 border-2 ${
                isDark ? 'bg-zinc-900 border-white/20 text-white' : 'bg-gray-50 border-black/20 text-black'
              }`}
              required
              minLength={3}
            />
            <p className="text-[10px] text-zinc-500">Only letters, numbers, and underscores</p>
          </div>

          <div className="space-y-2">
             <label className={`block font-[family-name:var(--font-pixel)] text-[10px] uppercase ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              Display Name
            </label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Display Name"
               className={`font-[family-name:var(--font-pixel-body)] rounded-none h-10 border-2 ${
                isDark ? 'bg-zinc-900 border-white/20 text-white' : 'bg-gray-50 border-black/20 text-black'
              }`}
              required
            />
          </div>

          {error && (
            <div className="p-2 bg-red-500/10 border border-red-500/50 text-red-500 text-[10px] font-[family-name:var(--font-pixel-body)]">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className={`w-full h-12 rounded-none border-2 font-[family-name:var(--font-pixel)] text-[10px] tracking-wider transition-all active:translate-y-0.5 ${
              isDark 
                ? 'bg-white text-black border-white hover:bg-zinc-200' 
                : 'bg-black text-white border-black hover:bg-zinc-800'
            }`}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "START GAME"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
