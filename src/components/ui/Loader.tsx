export interface LoaderProps {
  fullScreen?: boolean;
}

export function Loader({ fullScreen = false }: LoaderProps) {
  const containerClasses = fullScreen
    ? "flex items-center justify-center min-h-screen  z-50 fixed inset-0"
    : "flex items-center justify-center w-full h-full min-h-[70vh] ";

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
