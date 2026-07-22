import { requireSession } from "@/lib/session";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import MobileNav from "@/components/MobileNav";
import { getWorkspace } from "@/lib/accounts";
import { listProjects, getActiveProject } from "@/lib/projects";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  const [workspace, projects, active] = await Promise.all([
    getWorkspace(session.wid),
    listProjects(session.wid),
    getActiveProject(session.wid),
  ]);

  const user = {
    name: session.name,
    email: session.email,
    role: session.role,
    workspace: workspace?.name ?? "Workspace",
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar
        user={user}
        projects={projects.map((p) => ({
          id: p.id,
          name: p.name,
          count: p.channel_count,
        }))}
        activeId={active?.id ?? null}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar user={user} activeProject={active?.name ?? null} />
        <MobileNav />
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
