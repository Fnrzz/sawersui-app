import { getStreamerByUsername } from "@/lib/actions/donation";
import { getExclusiveContentWithAccess } from "@/lib/actions/exclusive-content";
import { ExclusiveContentList } from "@/components/exclusive/ExclusiveContentList";
import { ArrowLeft, Lock } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface ExclusivePageProps {
  params: Promise<{
    username: string;
  }>;
}

export async function generateMetadata({ params }: ExclusivePageProps) {
  const { username } = await params;
  const streamer = await getStreamerByUsername(username);

  if (!streamer) return { title: "Not Found" };

  return {
    title: `Exclusive Content - ${streamer.display_name} | SawerSui`,
    description: `Unlock exclusive content from ${streamer.display_name} by donating USDC on Sui.`,
  };
}

export default async function ExclusivePage({ params }: ExclusivePageProps) {
  const { username } = await params;
  const streamer = await getStreamerByUsername(username);

  if (!streamer) {
    notFound();
  }

  // For now, pass null as donorAddress since we can't easily get it server-side
  // The client component can handle wallet connection state
  const contents = await getExclusiveContentWithAccess(streamer.id, null);

  return (
    <div className="min-h-screen p-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href={`/${username}`}
          className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-lg font-bold font-[family-name:var(--font-pixel)]">
            EXCLUSIVE CONTENT
          </h1>
          <p className="text-sm text-gray-500">
            by {streamer.display_name}
          </p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="mb-6 p-4 rounded-2xl bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800/30">
        <div className="flex items-center gap-2 mb-1">
          <Lock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <p className="text-sm font-bold text-purple-700 dark:text-purple-300">
            Gated Content
          </p>
        </div>
        <p className="text-xs text-purple-600 dark:text-purple-400">
          Donate to {streamer.display_name} to unlock exclusive content.
          Your total donations determine what you can access.
        </p>
      </div>

      {/* Content List */}
      <ExclusiveContentList
        contents={contents}
        streamerName={streamer.display_name}
      />
    </div>
  );
}
