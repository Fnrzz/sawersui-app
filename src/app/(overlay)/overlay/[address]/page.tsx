import { getStreamerByAddress } from "@/lib/actions/donation";
import { getOverlaySettings } from "@/lib/actions/settings";
import { DonationAlert } from "@/components/overlay/DonationAlert";

interface OverlayPageProps {
  params: Promise<{
    address: string;
  }>;
}

export default async function OverlayPage(props: OverlayPageProps) {
  const { address } = await props.params;
  const streamer = await getStreamerByAddress(address);

  if (!streamer) {
    return (
      <div className="h-screen w-full flex items-center justify-center text-white font-[family-name:var(--font-pixel)]">
        STREAMER NOT FOUND
      </div>
    );
  }

  // Fetch the streamer's overlay settings (returns defaults if none configured)
  const settings = await getOverlaySettings(streamer.id);

  return <DonationAlert streamerId={streamer.id} streamerAddress={address} settings={settings} />;
}
