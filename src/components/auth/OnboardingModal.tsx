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
        className="w-[calc(100%-32px)] max-w-sm mx-auto border-[3px] border-[#2a2a2a] rounded-xl p-0 overflow-hidden gap-0 bg-white shadow-[4px_4px_0px_0px_#2a2a2a]"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="border-b border-border px-6 py-5 text-center bg-amber-50">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-foreground">
              Selamat Datang! 👋
            </DialogTitle>
            <DialogDescription className="text-xs mt-1 text-muted-foreground">
              Buat profil streamer kamu
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase text-muted-foreground tracking-wider">
              Username
            </label>
            <Input
              value={username}
              onChange={(e) =>
                setUsername(
                  e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""),
                )
              }
              placeholder="username"
              className="rounded-xl h-11 border border-border bg-muted text-foreground focus:ring-2 focus:ring-primary/20"
              required
              minLength={3}
            />
            <p className="text-[10px] text-muted-foreground">
              Huruf kecil, angka, dan underscore
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase text-muted-foreground tracking-wider">
              Nama Tampilan
            </label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Nama tampilan kamu"
              className="rounded-xl h-11 border border-border bg-muted text-foreground focus:ring-2 focus:ring-primary/20"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl font-bold text-sm bg-primary text-white hover:bg-amber-600 transition-colors orange-glow"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Mulai Sekarang 🚀"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
