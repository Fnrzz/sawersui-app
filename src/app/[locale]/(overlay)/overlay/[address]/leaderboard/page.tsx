
import { getStreamerByAddress } from "@/lib/actions/donation";
import { getLeaderboard } from "@/lib/actions/leaderboard";
import { RealtimeLeaderboard } from "@/components/overlay/RealtimeLeaderboard";

interface OverlayLeaderboardPageProps {
  params: Promise<{
    address: string;
  }>;
}

export default async function OverlayLeaderboardPage(props: OverlayLeaderboardPageProps) {
  const { address } = await props.params;
  const streamer = await getStreamerByAddress(address);

  if (!streamer) {
    return (
      <div className="min-h-screen grid place-items-center text-white font-bold p-4 text-center">
        STREAMER NOT FOUND
      </div>
    );
  }

  const initialData = await getLeaderboard(streamer.id);

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4">
      <RealtimeLeaderboard initialData={initialData} streamerId={streamer.id} />
    </div>
  );
}
