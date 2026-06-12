import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import VisitHistoryClient from "./VisitHistoryClient";
import SignOutButton from "@/components/SignOutButton";

async function getVisits(userId: string) {
  return prisma.visit.findMany({
    where: { property: { customer: { userId } } },
    include: {
      property: { select: { id: true, address: true, postcode: true } },
      technician: { include: { user: { select: { name: true } } } },
      report: true,
    },
    orderBy: { scheduledAt: "desc" },
  });
}

export default async function CustomerVisitHistoryPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const visits = await getVisits((session.user as any).id);

  return (
    <div className="max-w-3xl mx-auto space-y-5 md:space-y-6 py-4 md:py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Visit history</h1>
          <p className="text-gray-500 mt-1">All visits across your properties</p>
        </div>
        <SignOutButton />
      </div>
      <VisitHistoryClient visits={visits} />
    </div>
  );
}
