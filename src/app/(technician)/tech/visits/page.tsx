import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import TechVisitsClient from "./TechVisitsClient";

export default async function TechVisitsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const userId = (session.user as any).id as string;

  const technician = await prisma.technician.findUnique({ where: { userId } });
  if (!technician) redirect("/login");

  const visits = await prisma.visit.findMany({
    where: { technicianId: technician.id },
    include: {
      property: {
        include: { customer: { include: { user: { select: { name: true } } } } },
      },
      report: { select: { signedByTechnician: true, followUpRequired: true } },
    },
    orderBy: { scheduledAt: "desc" },
  });

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My visits</h1>
        <p className="text-gray-500 mt-1">All visits assigned to you</p>
      </div>
      <TechVisitsClient visits={visits} />
    </div>
  );
}
