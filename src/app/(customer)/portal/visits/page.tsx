import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

const statusColors: Record<string, string> = {
  SCHEDULED:   "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-yellow-100 text-yellow-700",
  COMPLETED:   "bg-green-100 text-green-700",
  CANCELLED:   "bg-red-100 text-red-700",
};

const typeLabels: Record<string, string> = {
  ROUTINE_PLUMBING:   "Routine Plumbing",
  ROUTINE_ELECTRICAL: "Routine Electrical",
  ROUTINE_BOTH:       "Plumbing & Electrical",
  BOILER_SERVICE:     "Boiler Service",
  EMERGENCY:          "Emergency",
};

const checkColors: Record<string, string> = {
  PASS:        "text-green-600",
  ADVISORY:    "text-amber-600",
  FAIL:        "text-red-600",
  NOT_CHECKED: "text-gray-400",
};

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

  const completed  = visits.filter((v) => v.status === "COMPLETED").length;
  const upcoming   = visits.filter((v) => v.status === "SCHEDULED").length;
  const cancelled  = visits.filter((v) => v.status === "CANCELLED").length;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Visit history</h1>
        <p className="text-gray-500 mt-1">All visits across your properties</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total",     value: visits.length, color: "text-gray-900" },
          { label: "Completed", value: completed,      color: "text-green-600" },
          { label: "Upcoming",  value: upcoming,       color: "text-blue-600" },
          { label: "Cancelled", value: cancelled,      color: "text-red-500" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-200 px-4 py-4 text-center">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Visit list */}
      {visits.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-12">No visits recorded yet.</p>
      ) : (
        <div className="space-y-4">
          {visits.map((v) => (
            <Link
              key={v.id}
              href={`/portal/visits/${v.id}`}
              className="block bg-white rounded-2xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between p-5">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900">
                    {new Date(v.scheduledAt).toLocaleDateString("en-GB", {
                      weekday: "long", day: "numeric", month: "long", year: "numeric",
                    })}
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {typeLabels[v.type] ?? v.type} · {v.property.address}
                    {v.technician ? ` · ${v.technician.user.name}` : " · Technician TBC"}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 ml-4 shrink-0">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[v.status]}`}>
                    {v.status.replace("_", " ")}
                  </span>
                  {v.report?.followUpRequired && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                      Follow-up needed
                    </span>
                  )}
                  {v.isEmergency && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-700">
                      Emergency
                    </span>
                  )}
                </div>
              </div>

              {v.report?.signedByTechnician && (
                <div className="px-5 pb-5 pt-0">
                  <div className="border-t border-gray-100 pt-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Report summary</p>
                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                      {[
                        ["Pipes",      v.report.pipesCheck],
                        ["Heating",    v.report.heatingCheck],
                        ["Electrical", v.report.electricalCheck],
                        ["Boiler",     v.report.boilerCheck],
                      ].filter(([, r]) => r !== "NOT_CHECKED").map(([label, result]) => (
                        <div key={label as string} className="flex items-center gap-1.5">
                          <span className="text-gray-500">{label}</span>
                          <span className={`font-medium ${checkColors[result as string]}`}>
                            {(result as string).charAt(0) + (result as string).slice(1).toLowerCase()}
                          </span>
                        </div>
                      ))}
                    </div>
                    {v.report.recommendations && (
                      <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                        <span className="font-medium">Recommendations:</span> {v.report.recommendations}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
