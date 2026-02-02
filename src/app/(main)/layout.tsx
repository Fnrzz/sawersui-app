import { Navbar } from "@/components/layout/Navbar";


export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen flex justify-center font-[family-name:var(--font-pixel-body)] bg-gray-100 dark:bg-black">
      <div className="w-full max-w-md h-full relative flex flex-col bg-white dark:bg-zinc-950 shadow-2xl overflow-hidden">
        <Navbar />
        <main className="flex-1 flex flex-col relative w-full overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
