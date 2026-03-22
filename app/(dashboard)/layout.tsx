import Sidebar from "../components/Sidebar";
import PageHeader from "../components/PageHeader";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-dvh">
      <Sidebar />

      {/* Main content area — offset by sidebar width */}
      <main className="ml-[68px] flex-1 overflow-y-auto p-6">
        <PageHeader />
        {children}
      </main>
    </div>
  );
}
