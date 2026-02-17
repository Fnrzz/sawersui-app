"use client";

import { useState, useTransition, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import { uploadToWalrus } from "@/lib/walrus";
import { createMilestone } from "@/lib/actions/milestone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Upload, X } from "lucide-react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";

export default function CreateMilestoneForm() {
  const t = useTranslations("Milestone.create");
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [coinType, setCoinType] = useState<"USDC" | "SUI">("USDC");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
    },
    maxFiles: 1,
    disabled: isPending,
  });

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      toast.error(t("toast.selectImage"));
      return;
    }

    startTransition(async () => {
      try {
        // 1. Upload to Walrus via direct client upload
        toast.info(t("toast.uploading"));

        const uploadResult = await uploadToWalrus(file, 2);

        const {
          blobId,
          blobObjectId,
          url: walrusUrl,
          expiresAt,
        } = uploadResult;
        toast.success(t("toast.uploaded"));

        // 2. Call Server Action
        const result = await createMilestone({
          title,
          target_amount: parseFloat(targetAmount),
          image_blob_id: blobId,
          blob_object_id: blobObjectId,
          walrus_url: walrusUrl,
          coin_type: coinType,
          expires_at: expiresAt,
        });

        if (result.error) {
          throw new Error(result.error);
        }

        toast.success(t("toast.success"));

        // Reset form
        setTitle("");
        setTargetAmount("");
        setCoinType("USDC");
        setFile(null);
        setPreview(null);

        // Refresh page
        window.location.reload();
      } catch (error: unknown) {
        console.error("Error creating milestone:", error);
        const message =
          error instanceof Error ? error.message : t("toast.error");
        toast.error(message);
      }
    });
  };

  // Check for active milestone to disable form
  // We can't easily fetch here without converting to async component or adding useEffect fetch
  // but we can rely on the server validation for safety, and for UX let's add a simple fetch
  const [hasActiveMilestone, setHasActiveMilestone] = useState(false);
  const [isLoadingCheck, setIsLoadingCheck] = useState(true);

  // We need to import getMilestones or similar, but getting server data in client component requires a prop or fetch
  // Let's use a quick effect to check via server action wrapper
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const { getMilestones } = await import("@/lib/actions/milestone");
        const milestones = await getMilestones();
        const activeOrCompleted = milestones.find(
          (m) => m.status === "active" || m.status === "completed",
        );
        if (activeOrCompleted) setHasActiveMilestone(true);
      } catch (e) {
        console.error("Failed to check milestone status", e);
      } finally {
        setIsLoadingCheck(false);
      }
    };
    checkStatus();
  }, []);

  if (isLoadingCheck) {
    return (
      <Card className="w-full border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white text-black p-8 flex justify-center">
        <Loader2 className="animate-spin w-8 h-8" />
      </Card>
    );
  }

  if (hasActiveMilestone) {
    return (
      <Card className="w-full border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-zinc-100 text-black">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-zinc-500">
            {t("activeTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center space-y-4">
          <div className="bg-yellow-100 border-2 border-black p-4 rounded-lg">
            <h3 className="font-bold text-lg">{t("activeTitle")}</h3>
            <p className="text-sm">{t("activeDesc")}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white text-black">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">
          Create New Milestone
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-bold">
              {t("labels.title")}
            </label>
            <Input
              id="title"
              placeholder={t("labels.titlePlaceholder")}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={isPending}
              className="border-2 border-black rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold block">
              {t("labels.coinType")}
            </label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setCoinType("USDC")}
                className={`flex-1 py-2 px-3 rounded text-sm font-bold border-2 border-black transition-all flex items-center justify-center gap-2
                  ${
                    coinType === "USDC"
                      ? "bg-blue-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      : "bg-white hover:bg-zinc-50"
                  }
                `}
              >
                <div
                  className={`w-3 h-3 rounded-full border border-black ${coinType === "USDC" ? "bg-blue-500" : "bg-white"}`}
                />
                USDC
              </button>
              <button
                type="button"
                onClick={() => setCoinType("SUI")}
                className={`flex-1 py-2 px-3 rounded text-sm font-bold border-2 border-black transition-all flex items-center justify-center gap-2
                  ${
                    coinType === "SUI"
                      ? "bg-blue-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      : "bg-white hover:bg-zinc-50"
                  }
                `}
              >
                <div
                  className={`w-3 h-3 rounded-full border border-black ${coinType === "SUI" ? "bg-blue-500" : "bg-white"}`}
                />
                SUI
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="targetAmount" className="text-sm font-bold">
              {t("labels.targetAmount", { coin: coinType })}
            </label>
            <Input
              id="targetAmount"
              type="number"
              step="0.01"
              min="0.5"
              placeholder={t("labels.targetPlaceholder")}
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              required
              disabled={isPending}
              className="border-2 border-black rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold">
              {t("labels.rewardImage")}
            </label>

            <div
              {...getRootProps()}
              className={`border-2 border-dashed border-black p-6 text-center cursor-pointer transition-colors relative
                ${isDragActive ? "bg-black/5" : "bg-white"}
                ${isPending ? "opacity-50 cursor-not-allowed" : "hover:bg-zinc-50"}
              `}
            >
              <input {...getInputProps()} />

              {file && preview ? (
                <div className="relative w-full aspect-video group">
                  <Image
                    src={preview}
                    alt="Preview"
                    fill
                    className="object-cover border-2 border-black"
                  />
                  <button
                    type="button"
                    onClick={removeFile}
                    className="absolute top-2 right-2 p-1 bg-red-500 border border-black text-white hover:bg-red-600 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-4">
                  <Upload className="w-8 h-8 text-black/50" />
                  <div className="text-sm font-bold">{t("labels.upload")}</div>
                  <p className="text-xs text-gray-500">
                    Supports: PNG, JPG, GIF, WEBP
                  </p>
                </div>
              )}
            </div>
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="w-full bg-black text-white hover:bg-gray-800 border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all font-bold"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("button.loading")}
              </>
            ) : (
              t("button.idle")
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
