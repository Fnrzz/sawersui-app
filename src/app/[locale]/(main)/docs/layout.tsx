import { DocsSidebar, MobileDocsSidebar } from "@/components/docs/DocsSidebar";
import { Marquee } from "@/components/ui/Marquee";

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Marquee />
      <div className="flex flex-1 flex-col md:flex-row">
        <DocsSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="flex items-center justify-between p-4 pb-0 md:pt-4 border-b md:border-none">
            <MobileDocsSidebar />
          </header>
          <main className="flex-1 py-4 px-6 md:px-12 lg:px-16 w-full max-w-5xl mx-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
