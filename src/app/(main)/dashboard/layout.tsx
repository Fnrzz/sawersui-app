import { BottomNav } from "@/components/dashboard/BottomNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Scrollable Content Area */}
      <div className="flex-1 w-full overflow-y-auto scrollbar-hide relative pb-24">
        {children}
      </div>
      
      {/* Fixed Bottom Nav */}
      <BottomNav />
    </>
  );
}
