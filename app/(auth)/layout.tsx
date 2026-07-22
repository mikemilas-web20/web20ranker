import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Already signed in? Skip the auth screens.
  const session = await getSession();
  if (session) redirect("/");

  return (
    <div className="min-h-screen grid place-items-center px-4 py-12 bg-ground">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
