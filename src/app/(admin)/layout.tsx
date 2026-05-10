import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import MobileAdminNav from "@/components/layout/MobileAdminNav";

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
      <MobileAdminNav name={user.name ?? "Admin"} photo={dbUser?.image ?? null} />
      <main className="flex-1 bg-gray-50 pt-[116px] px-4 pb-6 md:pt-0 md:px-0 md:pb-0 md:p-8">
        {children}
      </main>
    </div>
  );
}
