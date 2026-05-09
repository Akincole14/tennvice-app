import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import CustomerSidebar from "@/components/layout/CustomerSidebar";

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  const [properties, dbUser] = await Promise.all([
    userId
      ? prisma.property.findMany({
          where: { customer: { userId } },
          select: { id: true, address: true },
          orderBy: { createdAt: "asc" },
        })
      : Promise.resolve([]),
    userId
      ? prisma.user.findUnique({ where: { id: userId }, select: { name: true, image: true } })
      : Promise.resolve(null),
  ]);

  return (
    <div className="flex min-h-screen">
      <CustomerSidebar
        properties={properties}
        name={dbUser?.name ?? undefined}
        photo={dbUser?.image ?? null}
      />
      <main className="flex-1 p-8 bg-gray-50">{children}</main>
    </div>
  );
}
