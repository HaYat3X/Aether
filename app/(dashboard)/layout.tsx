// import Sidebar from "../components/Sidebar";
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
        <div className="flex-1 overflow-y-auto px-9 pb-9">{children}</div>
      </main>
    </div>
  );
}
