"use client";

import { useState, useTransition } from "react";
import { Upload, Loader2 } from "lucide-react";
import { createExclusiveContent } from "@/lib/actions/exclusive-content";
import { storeDonationReceipt } from "@/lib/walrus";
import { CONFIG } from "@/lib/config";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function ExclusiveContentForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [minDonation, setMinDonation] = useState("5");
  const [contentText, setContentText] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!contentText.trim()) {
      toast.error("Content is required");
      return;
    }

    const minAmount = parseFloat(minDonation);
    if (isNaN(minAmount) || minAmount < 0.5) {
      toast.error("Minimum donation must be at least 0.50 USDC");
      return;
    }

    startTransition(async () => {
      try {
        // Upload content to Walrus
        const publisherUrl = CONFIG.WALRUS.PUBLISHER_URL;
        if (!publisherUrl) {
          toast.error("Walrus not configured");
          return;
        }

        const blob = new Blob([contentText], { type: "text/plain" });
        const response = await fetch(`${publisherUrl}/v1/blobs`, {
          method: "PUT",
          body: blob,
        });

        if (!response.ok) {
          throw new Error("Failed to upload to Walrus");
        }

        const result = await response.json();
        const blobId =
          result.newlyCreated?.blobObject?.blobId ||
          result.alreadyCertified?.blobId;

        if (!blobId) {
          throw new Error("No blob ID returned from Walrus");
        }

        // Save to database
        const saveResult = await createExclusiveContent({
          title: title.trim(),
          description: description.trim(),
          minDonationUsdc: minAmount,
          walrusBlobId: blobId,
          contentType: "text",
        });

        if (!saveResult.success) {
          throw new Error(saveResult.error || "Failed to save");
        }

        toast.success("Exclusive content created!");
        setTitle("");
        setDescription("");
        setContentText("");
        setMinDonation("5");
        router.refresh();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to create content";
        toast.error(msg);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="My exclusive content"
          maxLength={100}
          className="w-full mt-1 px-4 py-3 rounded-lg text-sm border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Description (optional)
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What donors will get..."
          maxLength={200}
          className="w-full mt-1 px-4 py-3 rounded-lg text-sm border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Minimum Donation (USDC)
        </label>
        <input
          type="number"
          value={minDonation}
          onChange={(e) => setMinDonation(e.target.value)}
          min="0.5"
          step="0.5"
          className="w-full mt-1 px-4 py-3 rounded-lg text-sm border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Content
        </label>
        <textarea
          value={contentText}
          onChange={(e) => setContentText(e.target.value)}
          placeholder="Write your exclusive content here..."
          rows={5}
          maxLength={5000}
          className="w-full mt-1 px-4 py-3 rounded-lg text-sm border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white resize-none"
        />
        <p className="text-xs text-gray-400 mt-1 text-right">
          {contentText.length}/5000
        </p>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-3 rounded-lg bg-purple-600 text-white font-bold text-sm hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Uploading to Walrus...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4" />
            Create Exclusive Content
          </>
        )}
      </button>
    </form>
  );
}
