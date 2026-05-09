import { prisma } from "@/lib/prisma";
import VisitsClient from "./VisitsClient";

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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Visits</h1>
      <VisitsClient visits={visits} properties={properties} technicians={technicians} />
    </div>
  );
}
