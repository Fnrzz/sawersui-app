import { NextResponse } from "next/server";
import { uploadToWalrus } from "@/lib/walrus";

/**
 * POST /api/walrus/upload
 *
 * Simple and robust file upload via standard HTTP PUT to the Walrus Publisher.
 * The Publisher handles storage purchasing and distribution internally.
 */
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const epochs = 2; // Initial storage duration
    const result = await uploadToWalrus(file, epochs);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    console.error("[API/WalrusUpload] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
