import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getExclusiveContent } from "@/lib/actions/exclusive-content";
import { ArrowLeft, Lock, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { ExclusiveContentForm } from "@/components/dashboard/ExclusiveContentForm";
import { formatDistanceToNow } from "date-fns";

export default async function ExclusiveContentPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const contents = await getExclusiveContent(user.id);

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <Link
          href="/dashboard"
          className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-xl font-bold font-[family-name:var(--font-pixel)]">
          EXCLUSIVE CONTENT
        </h1>
      </div>

      {/* Upload Form */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden border border-gray-100 dark:border-white/5 shadow-sm">
        <div className="p-4 border-b border-gray-100 dark:border-white/5 flex items-center gap-2 text-sm font-bold text-gray-500">
          <Plus className="w-4 h-4" />
          Add New Content
        </div>
        <div className="p-4">
          <ExclusiveContentForm />
        </div>
      </div>

      {/* Existing Content */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden border border-gray-100 dark:border-white/5 shadow-sm">
        <div className="p-4 border-b border-gray-100 dark:border-white/5 flex items-center gap-2 text-sm font-bold text-gray-500">
          <Lock className="w-4 h-4" />
          Your Gated Content ({contents.length})
        </div>

        {contents.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p>No exclusive content yet.</p>
            <p className="text-xs mt-1">
              Upload content above to reward your donors!
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-white/5">
            {contents.map((content) => (
              <div
                key={content.id}
                className="p-4 flex items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 dark:text-white truncate">
                    {content.title}
                  </h3>
                  {content.description && (
                    <p className="text-sm text-gray-500 truncate">
                      {content.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-bold">
                      Min: {content.min_donation_usdc} USDC
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(content.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </div>
                <form
                  action={async () => {
                    "use server";
                    const { deleteExclusiveContent } = await import(
                      "@/lib/actions/exclusive-content"
                    );
                    await deleteExclusiveContent(content.id);
                    redirect("/dashboard/exclusive-content");
                  }}
                >
                  <button
                    type="submit"
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
