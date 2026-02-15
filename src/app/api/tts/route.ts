import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: NextRequest) {
  try {
    const { text, voiceType } = await req.json();
    if (!text) return NextResponse.json({ error: "No text" }, { status: 400 });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API Key missing" }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Map voice selection
    const voiceMap: Record<string, string> = {
      kore: "Kore",
      charon: "Charon",
      puck: "Puck",
      zephyr: "Zephyr",
    };
    const voiceName = voiceMap[voiceType] || "Kore";

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const audioContent =
      response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!audioContent) {
      console.error(
        "Gemini Response Error:",
        JSON.stringify(response, null, 2),
      );
      throw new Error("No audio content from Gemini");
    }

    return NextResponse.json({ audioBase64: audioContent });
  } catch (error) {
    console.error("TTS API Error:", error);
    return NextResponse.json({ error: "TTS Failed" }, { status: 500 });
  }
}
