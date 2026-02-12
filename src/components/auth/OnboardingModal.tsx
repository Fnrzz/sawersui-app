"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProfile, registerEnokiUser } from "@/lib/actions/auth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

interface OnboardingModalProps {
  open: boolean;
  initialData?: {
    username?: string | null;
    display_name?: string | null;
  };
  address?: string;
  onSuccess?: () => void;
}

export function OnboardingModal({
  open,
  initialData,
  address,
  onSuccess,
}: OnboardingModalProps) {
  const [username, setUsername] = useState(initialData?.username || "");
  const [displayName, setDisplayName] = useState(
    initialData?.display_name || "",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (address) {
        const result = await registerEnokiUser(address, username, displayName);
        if (!result.success) {
          throw new Error(result.error || "Registration failed");
        }
        if (onSuccess) onSuccess();
      } else {
        await updateProfile(username, displayName);
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memperbarui profil");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="w-[calc(100%-32px)] max-w-sm mx-auto border-[3px] border-black rounded-lg p-0 overflow-hidden gap-0 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="border-b-[3px] border-black px-6 py-5 text-center bg-[#FEFCE8]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-black">
              Selamat Datang! 👋
            </DialogTitle>
            <DialogDescription className="text-sm font-bold text-black/80 mt-1">
              Buat profil streamer kamu
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-black">
              Username <span className="text-red-500">*</span>
            </label>
            <Input
              value={username}
              onChange={(e) =>
                setUsername(
                  e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""),
                )
              }
              placeholder="username"
              className="w-full py-2 text-lg font-bold bg-transparent border-b-[3px] border-black text-black placeholder:text-black/30 focus:outline-none focus:border-black/60 rounded-none transition-all px-0 shadow-none border-t-0 border-l-0 border-r-0 focus-visible:ring-0"
              required
              minLength={3}
            />
            <p className="text-xs font-bold text-black/50">
              Huruf kecil, angka, dan underscore
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-black">
              Nama Tampilan <span className="text-red-500">*</span>
            </label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Nama tampilan kamu"
              className="w-full py-2 text-lg font-bold bg-transparent border-b-[3px] border-black text-black placeholder:text-black/30 focus:outline-none focus:border-black/60 rounded-none transition-all px-0 shadow-none border-t-0 border-l-0 border-r-0 focus-visible:ring-0"
              required
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-100 border-2 border-black font-bold">
              <div className="w-4 h-4 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full py-6 rounded-lg font-black text-lg bg-[#F59E0B] text-black border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-y-1 hover:shadow-none hover:bg-[#F59E0B]/90 disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none disabled:translate-y-1 disabled:bg-gray-400"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin text-black" />
            ) : (
              "Mulai Sekarang 🚀"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
