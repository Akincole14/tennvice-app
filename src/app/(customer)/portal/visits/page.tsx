import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

const statusColors: Record<string, string> = {
  SCHEDULED:   "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-yellow-100 text-yellow-700",
  COMPLETED:   "bg-green-100 text-green-700",
  CANCELLED:   "bg-red-100 text-red-700",
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
      property: { select: { address: true, postcode: true } },
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
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Visit history</h1>
      <p className="text-gray-500 mb-8">All visits across your properties</p>

      {visits.length === 0 ? (
        <p className="text-gray-400">No visits recorded yet.</p>
      ) : (
        <div className="space-y-4">
          {visits.map((v) => (
            <div key={v.id} className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-semibold text-gray-900">
                    {new Date(v.scheduledAt).toLocaleDateString("en-GB", {
                      weekday: "long", day: "numeric", month: "long", year: "numeric",
                    })}
                  </p>
                  <p className="text-sm text-gray-500">
                    {v.property.address}, {v.property.postcode} ·{" "}
                    {v.type.replace(/_/g, " ").toLowerCase()} ·{" "}
                    {v.technician?.user.name ?? "Technician TBC"}
                  </p>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[v.status]}`}>
                  {v.status}
                </span>
              </div>

              {v.report && (
                <div className="border-t border-gray-100 pt-4 mt-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Report summary</p>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                    {[
                      ["Pipes",       v.report.pipesCheck],
                      ["Heating",     v.report.heatingCheck],
                      ["Water pump",  v.report.waterPumpCheck],
                      ["Cylinder",    v.report.cylinderCheck],
                      ["Pressure",    v.report.pressureCheck],
                      ["Leakage",     v.report.leakageCheck],
                      ["Electrical",  v.report.electricalCheck],
                      ["Boiler",      v.report.boilerCheck],
                    ].filter(([, r]) => r !== "NOT_CHECKED").map(([label, result]) => (
                      <div key={label as string} className="flex items-center justify-between">
                        <span className="text-gray-600">{label}</span>
                        <span className={`font-medium ${checkColors[result as string]}`}>
                          {(result as string).charAt(0) + (result as string).slice(1).toLowerCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                  {v.report.recommendations && (
                    <p className="mt-3 text-sm text-gray-600">
                      <span className="font-medium">Recommendations:</span> {v.report.recommendations}
                    </p>
                  )}
                  {v.report.followUpRequired && (
                    <p className="mt-2 text-sm text-amber-600 font-medium">Follow-up visit required</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
