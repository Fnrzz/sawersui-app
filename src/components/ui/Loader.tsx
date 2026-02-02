export interface LoaderProps {
  fullScreen?: boolean;
}

export function Loader({ fullScreen = false }: LoaderProps) {
  const containerClasses = fullScreen
    ? "flex items-center justify-center min-h-screen bg-white dark:bg-zinc-950 z-50 fixed inset-0"
    : "flex items-center justify-center w-full h-full min-h-[50vh] bg-white dark:bg-zinc-950";

  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center gap-4">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-48 h-48 object-contain"
        >
          <source src="/loading.webm" type="video/webm" />
        </video>
      </div>
    </div>
  );
}
