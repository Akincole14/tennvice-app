import { prisma } from "@/lib/prisma";
import VisitsClient from "./VisitsClient";
import SignOutButton from "@/components/SignOutButton";

async function getData() {
  const [visits, properties, technicians] = await Promise.all([
    prisma.visit.findMany({
      include: {
        property: {
          include: { customer: { include: { user: { select: { name: true } } } } },
        },
        technician: { select: { id: true, user: { select: { name: true } } } },
        report: { select: { signedByTechnician: true, followUpRequired: true } },
      },
      orderBy: { scheduledAt: "asc" },
    }),
    prisma.property.findMany({
      include: { customer: { include: { user: { select: { name: true } } } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.technician.findMany({
      select: { id: true, user: { select: { name: true } } },
    }),
  ]);

  return { visits, properties, technicians };
}

export default async function VisitsPage() {
  const { visits, properties, technicians } = await getData();

  return (
    <div className="max-w-6xl mx-auto space-y-5 md:space-y-6 py-4 md:py-8">
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Visits</h1>
        <SignOutButton />
      </div>
      <VisitsClient visits={visits} properties={properties} technicians={technicians} />
    </div>
  );
}
