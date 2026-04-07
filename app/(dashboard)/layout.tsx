import Sidebar from "../components/feature/Sidebar";
import PageHeader from "../components/PageHeader";
import { auth } from "@/auth";
import "../globals.css";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="flex h-dvh">
      <Sidebar user={session?.user ?? null} />

      {/* Main content area */}
      <main
        className="dashboard-main"
        style={{
          marginLeft: "225px",
          background: "var(--color-bg-base)",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          transition: "margin-left 0.3s ease",
        }}
      >
        {/* Fixed header */}
        <div className="shrink-0 px-9 pt-7">
          <div className="mx-auto w-full max-w-[1200px]">
            <PageHeader />
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-9 pb-9">
          <div className="mx-auto w-full max-w-[1200px] h-full">{children}</div>
        </div>
      </main>
    </div>
  );
}
