import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const user    = session?.user as any;

  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/login");

  const dbUser = await prisma.user.findUnique({
    where:  { id: user.id },
    select: { image: true },
  });

  return (
    <div className="flex min-h-screen">
      <Sidebar role="ADMIN" name={user.name ?? "Admin"} photo={dbUser?.image ?? null} />
      <main className="flex-1 p-8 bg-gray-50">{children}</main>
    </div>
  );
}
