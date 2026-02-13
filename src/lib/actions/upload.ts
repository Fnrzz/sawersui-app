"use server";

import { uploadToWalrus } from "@/lib/walrus";

export async function uploadImage(formData: FormData) {
  const file = formData.get("file") as File;

  if (!file) {
    return { error: "No file provided" };
  }

  try {
    const result = await uploadToWalrus(file);
    return { success: true, data: result };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to upload image",
    };
  }
}
