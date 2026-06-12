import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, CheckCircle, Clock, AlertTriangle, ChevronRight } from "lucide-react";
import SignOutButton from "@/components/SignOutButton";

const typeLabels: Record<string, string> = {
  ROUTINE_PLUMBING:   "Routine Plumbing",
  ROUTINE_ELECTRICAL: "Routine Electrical",
  ROUTINE_BOTH:       "Plumbing & Electrical",
  BOILER_SERVICE:     "Boiler Service",
  EMERGENCY:          "Emergency",
};

const statusColors: Record<string, string> = {
  SCHEDULED:   "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-yellow-100 text-yellow-700",
  COMPLETED:   "bg-green-100 text-green-700",
  CANCELLED:   "bg-red-100 text-red-700",
};

export default async function AdminTechViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const technician = await prisma.technician.findUnique({
    where: { id },
    include: {
      user: { select: { name: true } },
      visits: {
        include: {
          property: {
            include: { customer: { include: { user: { select: { name: true, phone: true } } } } },
          },
          report: { select: { signedByTechnician: true } },
        },
        orderBy: { scheduledAt: "asc" },
      },
    },
  });

  if (!technician) notFound();

  const now      = new Date();
  const today    = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const weekEnd  = new Date(today); weekEnd.setDate(weekEnd.getDate() + 7);

  const todayVisits = technician.visits.filter(v =>
    new Date(v.scheduledAt) >= today && new Date(v.scheduledAt) < tomorrow
    && v.status !== "CANCELLED"
  );
  const upcomingVisits = technician.visits.filter(v =>
    new Date(v.scheduledAt) >= tomorrow && new Date(v.scheduledAt) <= weekEnd
    && v.status !== "CANCELLED"
  );
  const activeVisit    = technician.visits.find(v => v.status === "IN_PROGRESS");
  const completed      = technician.visits.filter(v => v.status === "COMPLETED").length;
  const pendingReports = technician.visits.filter(
    v => v.status === "COMPLETED" && v.report && !v.report.signedByTechnician
  ).length;
  const totalAssigned  = technician.visits.filter(v => v.status !== "CANCELLED").length;

  const firstName = technician.user.name?.split(" ")[0] ?? "Technician";

  const h = now.getHours();
  const greeting = h < 12 ? "morning" : h < 17 ? "afternoon" : "evening";

  return (
    <div className="max-w-3xl mx-auto space-y-5 md:space-y-6 py-4 md:py-8">

      {/* Top bar */}
      <div className="flex items-center justify-between gap-4">
        <Link href={`/technicians/${id}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" />
          Back to profile
        </Link>
        <SignOutButton />
      </div>

      {/* Admin badge + header */}
      <div>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200 px-2.5 py-1 rounded-full mb-3">
          Admin view — technician dashboard
        </span>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Good {greeting}, {firstName}</h1>
            <p className="text-gray-500 mt-1">
              Viewing as <span className="font-medium text-gray-700">{technician.user.name}</span>
              {todayVisits.length > 0
                ? ` · ${todayVisits.length} visit${todayVisits.length > 1 ? "s" : ""} today`
                : " · No visits today"}
            </p>
          </div>
        </div>
      </div>

      {/* Active visit banner */}
      {activeVisit && (
        <Link
          href={`/visits/${activeVisit.id}`}
          className="block bg-yellow-500 text-white rounded-2xl p-5 hover:bg-yellow-600 transition-colors"
        >
          <p className="text-yellow-100 text-xs font-semibold uppercase tracking-wide mb-1">Active visit</p>
          <p className="text-lg font-bold">{activeVisit.property.address.split(",")[0]}</p>
          <p className="text-yellow-100 text-sm mt-0.5">
            {typeLabels[activeVisit.type] ?? activeVisit.type} · View in admin
          </p>
        </Link>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {[
          { icon: Calendar,      label: "Total assigned", value: totalAssigned,  color: "text-gray-900 bg-gray-50" },
          { icon: CheckCircle,   label: "Completed",       value: completed,      color: "text-green-600 bg-green-50" },
          { icon: AlertTriangle, label: "Pending reports", value: pendingReports, color: pendingReports > 0 ? "text-amber-600 bg-amber-50" : "text-gray-400 bg-gray-50" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-200 p-3 sm:p-5 flex flex-col sm:flex-row items-center sm:items-start gap-1.5 sm:gap-3 text-center sm:text-left">
            <div className={`p-2 sm:p-2.5 rounded-xl shrink-0 ${color}`}><Icon className="w-4 h-4" /></div>
            <div>
              <p className="text-lg sm:text-xl font-bold text-gray-900">{value}</p>
              <p className="text-[10px] sm:text-xs text-gray-500 leading-tight">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Today's visits */}
      {todayVisits.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Today's visits</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {todayVisits.map(v => (
              <Link
                key={v.id}
                href={`/visits/${v.id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors group"
              >
                <div className="min-w-0">
                  <p className="font-medium text-gray-900">
                    {new Date(v.scheduledAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                    {" · "}
                    {v.property.address.split(",")[0]}
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {typeLabels[v.type] ?? v.type}
                    {v.property.customer?.user.name ? ` · ${v.property.customer.user.name}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-3 shrink-0">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[v.status]}`}>
                    {v.status.replace("_", " ")}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming this week */}
      {upcomingVisits.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Coming up this week</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {upcomingVisits.map(v => (
              <Link
                key={v.id}
                href={`/visits/${v.id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors group"
              >
                <div className="min-w-0">
                  <p className="font-medium text-gray-900">
                    {new Date(v.scheduledAt).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
                    {" at "}
                    {new Date(v.scheduledAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {v.property.address.split(",")[0]} · {typeLabels[v.type] ?? v.type}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 ml-3 shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {todayVisits.length === 0 && upcomingVisits.length === 0 && !activeVisit && (
        <div className="bg-white rounded-2xl border border-gray-200 px-6 py-12 text-center">
          <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-600">No visits scheduled this week</p>
        </div>
      )}

    </div>
  );
}
