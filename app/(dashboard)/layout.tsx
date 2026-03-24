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

      {/* Main content area */}
      <main
        className="ml-[260px] flex flex-1 flex-col overflow-hidden"
        style={{
          background: "var(--color-bg-base)",
        }}
      >
        {/* Fixed header */}
        <div className="shrink-0 px-9 pt-7">
          <PageHeader />
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-9 pb-9">
          {children}
        </div>
      </main>
    </div>
  );
}