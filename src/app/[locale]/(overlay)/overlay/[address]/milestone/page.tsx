import { RealtimeMilestone } from "@/components/overlay/RealtimeMilestone";
import { getUserId } from "@/lib/actions/user";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{
    address: string;
  }>;
}

export default async function MilestoneOverlayPage({ params }: PageProps) {
  const { address } = await params;

  // Resolve username/address to ID
  const userId = await getUserId(address);

  if (!userId) {
    return notFound();
  }

  // Fetch initial milestone server-side to avoid RLS issues
  const { createAdminClient } = await import("@/lib/supabase/server");
  const supabase = await createAdminClient();
  const { data: initialMilestone } = await supabase
    .from("milestones")
    .select("*")
    .eq("streamer_id", userId)
    .eq("status", "active")
    .maybeSingle();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <RealtimeMilestone streamerId={userId} initialData={initialMilestone} />
    </div>
  );
}
