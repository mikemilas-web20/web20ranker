import { requireSession } from "@/lib/session";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import MobileNav from "@/components/MobileNav";
import { getWorkspace } from "@/lib/accounts";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  const workspace = await getWorkspace(session.wid);

  const user = {
    name: session.name,
    email: session.email,
    role: session.role,
    workspace: workspace?.name ?? "Workspace",
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar user={user} />
        <MobileNav />
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
