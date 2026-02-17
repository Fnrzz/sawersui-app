import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ShareLinkClient } from "@/components/dashboard/ShareLinkClient";

export default async function SharePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  const username = profile?.username || "";

  return <ShareLinkClient username={username} />;
}
