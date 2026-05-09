import { prisma } from "@/lib/prisma";
import VisitsClient from "./VisitsClient";

async function getData() {
  const [visits, properties, technicians] = await Promise.all([
    prisma.visit.findMany({
      include: {
        property: {
          include: { customer: { include: { user: { select: { name: true } } } } },
        },
        technician: { include: { user: { select: { name: true } } } },
        report: { select: { signedByTechnician: true, followUpRequired: true } },
      },
      orderBy: { scheduledAt: "asc" },
    }),
    prisma.property.findMany({
      include: { customer: { include: { user: { select: { name: true } } } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.technician.findMany({
      include: { user: { select: { name: true } } },
    }),
  ]);

  const stats = {
    total: visits.length,
    upcoming: visits.filter((v) => v.status === "SCHEDULED").length,
    inProgress: visits.filter((v) => v.status === "IN_PROGRESS").length,
    completed: visits.filter((v) => v.status === "COMPLETED").length,
    cancelled: visits.filter((v) => v.status === "CANCELLED").length,
    emergency: visits.filter((v) => v.isEmergency).length,
  };

  return { visits, properties, technicians, stats };
}

export default async function VisitsPage() {
  const { visits, properties, technicians, stats } = await getData();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Visits</h1>

      {/* Stats bar */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
        {[
          { label: "Total",       value: stats.total,      color: "text-gray-900" },
          { label: "Upcoming",    value: stats.upcoming,    color: "text-blue-600" },
          { label: "In progress", value: stats.inProgress,  color: "text-yellow-600" },
          { label: "Completed",   value: stats.completed,   color: "text-green-600" },
          { label: "Cancelled",   value: stats.cancelled,   color: "text-red-500" },
          { label: "Emergency",   value: stats.emergency,   color: "text-rose-600" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-200 px-5 py-4">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <VisitsClient visits={visits} properties={properties} technicians={technicians} />
    </div>
  );
}
