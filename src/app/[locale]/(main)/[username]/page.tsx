import { notFound } from "next/navigation";
import { getStreamerByUsername } from "@/lib/actions/donation";
import { DonationPageClient } from "@/components/donation/DonationPageClient";

// ============================================================
// TYPES
// ============================================================

interface DonationPageProps {
  params: Promise<{ username: string }>;
}

// ============================================================
// PAGE COMPONENT
// ============================================================

export default async function DonationPage({ params }: DonationPageProps) {
  const { username } = await params;

  // Fetch streamer data
  const streamer = await getStreamerByUsername(username);

  // Handle 404
  if (!streamer) {
    notFound();
  }

  // Fetch overlay settings
  const { getOverlaySettings } = await import("@/lib/actions/settings");
  const overlaySettings = await getOverlaySettings(streamer.id);

  return <DonationPageClient streamer={streamer} settings={overlaySettings} />;
}

// ============================================================
// METADATA
// ============================================================

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  return {
    title: `Donate to @${username} | SawerSui`,
    description: `Send a tip to @${username} using USDC on Sui Network`,
  };
}
