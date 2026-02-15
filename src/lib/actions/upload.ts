"use server";

/**
 * Server action to upload an image to Walrus.
 *
 * Delegates to the /api/walrus/upload API route which handles:
 * 1. On-chain WAL payment for storage reservation (Mainnet)
 * 2. HTTP upload to the Walrus Publisher
 *
 * This 2-step approach ensures WAL coins pay for storage while SUI
 * is only used for gas fees (2-Coin Architecture).
 */
export async function uploadImage(formData: FormData) {
  const file = formData.get("file") as File;

  if (!file) {
    return { error: "No file provided" };
  }

  try {
    // Build a new FormData to forward to the upload API route
    const uploadFormData = new FormData();
    uploadFormData.append("file", file);

    // Use the internal API route for WAL-paid uploads
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/walrus/upload`, {
      method: "POST",
      body: uploadFormData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to upload image");
    }

    const result = await response.json();
    return { success: true, data: result.data };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to upload image",
    };
  }
}
