import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center font-[family-name:var(--font-pixel-body)]">
      <div className="text-center space-y-6 p-8">
        <div className="text-6xl">🔍</div>
        <h1 className="font-[family-name:var(--font-pixel)] text-xl text-black dark:text-white">
          STREAMER NOT FOUND
        </h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-sm">
          The user you&apos;re looking for doesn&apos;t exist or hasn&apos;t registered yet.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-black dark:bg-white text-white dark:text-black font-[family-name:var(--font-pixel)] text-xs tracking-wider uppercase hover:opacity-80 transition-opacity"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
