import { prisma } from "@/lib/prisma";
import TechniciansClient from "./TechniciansClient";

async function getData() {
  const technicians = await prisma.technician.findMany({
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      visits: {
        select: {
          id: true,
          status: true,
          scheduledAt: true,
          type: true,
          property: { select: { address: true } },
        },
        orderBy: { scheduledAt: "desc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const unassigned = await prisma.visit.count({
    where: { technicianId: null, status: { in: ["SCHEDULED", "IN_PROGRESS"] } },
  });

  return { technicians, unassigned };
}

export default async function TechniciansPage() {
  const { technicians, unassigned } = await getData();

  const totalCompleted = technicians.reduce(
    (sum, t) => sum + t.visits.filter(v => v.status === "COMPLETED").length, 0
  );
  const totalUpcoming = technicians.reduce(
    (sum, t) => sum + t.visits.filter(v => v.status === "SCHEDULED").length, 0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Technicians</h1>
          <p className="text-gray-500 mt-1">Manage your field team</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total technicians", value: technicians.length,  color: "text-gray-900" },
          { label: "Completed visits",  value: totalCompleted,       color: "text-green-600" },
          { label: "Upcoming visits",   value: totalUpcoming,        color: "text-blue-600" },
          { label: "Unassigned visits", value: unassigned,           color: unassigned > 0 ? "text-amber-600" : "text-gray-900" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-200 px-5 py-4 text-center">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <TechniciansClient technicians={technicians} />
    </div>
  );
}
