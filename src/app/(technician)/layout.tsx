import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import TechnicianSidebar from "@/components/layout/TechnicianSidebar";

export default async function TechnicianLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const user    = session?.user as any;

  if (!user) redirect("/login");
  if (user.role !== "TECHNICIAN") redirect("/login");

  const dbUser = await prisma.user.findUnique({
    where:  { id: user.id },
    select: { image: true },
  });

  return (
    <div className="flex min-h-screen">
      <TechnicianSidebar name={user.name ?? "Technician"} photo={dbUser?.image ?? null} />
      <main className="flex-1 p-8 bg-gray-50">{children}</main>
    </div>
  );
}
