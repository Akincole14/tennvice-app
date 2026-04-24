import { prisma } from "@/lib/prisma";

async function getVisits() {
  return prisma.visit.findMany({
    include: {
      property: {
        include: { customer: { include: { user: { select: { name: true } } } } },
      },
      technician: { include: { user: { select: { name: true } } } },
      report: { select: { signedByTechnician: true } },
    },
    orderBy: { scheduledAt: "asc" },
  });
}

const statusColors: Record<string, string> = {
  SCHEDULED:   "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-yellow-100 text-yellow-700",
  COMPLETED:   "bg-green-100 text-green-700",
  CANCELLED:   "bg-red-100 text-red-700",
};

export default async function VisitsPage() {
  const visits = await getVisits();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Visits</h1>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-5 py-3 font-medium text-gray-500">Date</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Customer</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Property</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Type</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Technician</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Status</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Report</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {visits.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-400">
                  No visits scheduled yet.
                </td>
              </tr>
            ) : (
              visits.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 text-gray-900">
                    {new Date(v.scheduledAt).toLocaleDateString("en-GB", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </td>
                  <td className="px-5 py-3 text-gray-900">{v.property.customer.user.name ?? "—"}</td>
                  <td className="px-5 py-3 text-gray-600">{v.property.address}</td>
                  <td className="px-5 py-3 text-gray-600 capitalize">
                    {v.type.replace(/_/g, " ").toLowerCase()}
                  </td>
                  <td className="px-5 py-3 text-gray-600">{v.technician?.user.name ?? "Unassigned"}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[v.status]}`}>
                      {v.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {v.report ? (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${v.report.signedByTechnician ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                        {v.report.signedByTechnician ? "Signed" : "Unsigned"}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">No report</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
