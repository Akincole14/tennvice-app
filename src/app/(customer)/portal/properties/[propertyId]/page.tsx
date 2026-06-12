import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Home, CheckCircle, AlertTriangle,
  XCircle, MinusCircle, FileText, Calendar,
} from "lucide-react";
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

const checkLabels = [
  { key: "pipesCheck",      label: "Pipes" },
  { key: "heatingCheck",    label: "Heating" },
  { key: "waterPumpCheck",  label: "Water pump" },
  { key: "cylinderCheck",   label: "Cylinder" },
  { key: "pressureCheck",   label: "Pressure" },
  { key: "leakageCheck",    label: "Leakage" },
  { key: "electricalCheck", label: "Electrical" },
  { key: "boilerCheck",     label: "Boiler" },
];

const checkIcon: Record<string, React.ElementType> = {
  PASS:        CheckCircle,
  ADVISORY:    AlertTriangle,
  FAIL:        XCircle,
  NOT_CHECKED: MinusCircle,
};

const checkColor: Record<string, string> = {
  PASS:        "text-green-600",
  ADVISORY:    "text-amber-500",
  FAIL:        "text-red-600",
  NOT_CHECKED: "text-gray-300",
};

function overallHealth(checks: string[]): { label: string; color: string; bg: string } {
  if (checks.includes("FAIL"))     return { label: "Needs attention", color: "text-red-700",   bg: "bg-red-50 border-red-200" };
  if (checks.includes("ADVISORY")) return { label: "Advisory notes",  color: "text-amber-700", bg: "bg-amber-50 border-amber-200" };
  if (checks.some(c => c === "PASS")) return { label: "All clear",    color: "text-green-700", bg: "bg-green-50 border-green-200" };
  return { label: "No data yet", color: "text-gray-500", bg: "bg-gray-50 border-gray-200" };
}

export default async function PropertyDetailPage({ params }: { params: Promise<{ propertyId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const { propertyId } = await params;
  const userId = (session.user as any).id;

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    include: {
      customer: { include: { user: { select: { id: true } } } },
      visits: {
        include: {
          technician: { include: { user: { select: { name: true } } } },
          report: true,
        },
        orderBy: { scheduledAt: "desc" },
      },
    },
  });

  if (!property || property.customer.user.id !== userId) notFound();

  const now = new Date();

  const completed = property.visits.filter(v => v.status === "COMPLETED");
  const upcoming  = property.visits.filter(v => v.status === "SCHEDULED" && new Date(v.scheduledAt) >= now);
  const nextVisit = upcoming.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0];

  const lastSigned = completed.find(v => v.report?.signedByTechnician);
  const lastChecks = lastSigned?.report
    ? checkLabels.map(c => (lastSigned.report as any)[c.key] as string)
    : [];
  const health = overallHealth(lastChecks.filter(c => c !== "NOT_CHECKED"));
  const hasFollowUp = property.visits.some(v => v.report?.followUpRequired && !v.report.signedByTechnician);

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-4 md:py-8">
      <div className="flex items-center justify-between gap-4">
        <Link href="/portal" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" />
          Back to My Home
        </Link>
        <SignOutButton />
      </div>

      {/* Property header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-brand-50 rounded-xl shrink-0">
              <Home className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{property.address}</h1>
              <p className="text-sm text-gray-500 mt-0.5">{property.postcode}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  {property.propertyType}{property.bedrooms ? ` · ${property.bedrooms} bed` : ""}
                </span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${(property as any).ownershipType === "TENANT" ? "bg-blue-50 text-blue-700" : "bg-green-50 text-green-700"}`}>
                  {(property as any).ownershipType === "TENANT" ? "Tenant" : "Owner"}
                </span>
              </div>
            </div>
          </div>
          <Link
            href={`/portal/report/${property.id}`}
            className="flex items-center gap-1.5 text-xs text-brand-600 border border-brand-200 rounded-lg px-3 py-1.5 hover:bg-brand-50 font-medium transition-colors shrink-0"
          >
            <FileText className="w-3.5 h-3.5" />
            Service report
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-gray-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{property.visits.length}</p>
            <p className="text-xs text-gray-500">Total visits</p>
          </div>
          <div className="text-center border-x border-gray-100">
            <p className="text-2xl font-bold text-green-600">{completed.length}</p>
            <p className="text-xs text-gray-500">Completed</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{upcoming.length}</p>
            <p className="text-xs text-gray-500">Upcoming</p>
          </div>
        </div>
      </div>

      {/* Follow-up alert */}
      {hasFollowUp && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 text-amber-700">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <p className="text-sm font-medium">A follow-up visit has been recommended for this property. We'll be in touch to arrange this.</p>
        </div>
      )}

      {/* Next visit */}
      {nextVisit ? (
        <Link href={`/portal/visits/${nextVisit.id}`} className="block bg-brand-600 text-white rounded-2xl p-5 hover:bg-brand-700 transition-colors">
          <p className="text-brand-200 text-xs font-semibold uppercase tracking-wide mb-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" /> Next visit
          </p>
          <p className="text-lg font-bold">
            {new Date(nextVisit.scheduledAt).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
            {" at "}
            {new Date(nextVisit.scheduledAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
          </p>
          <p className="text-brand-200 text-sm mt-1">
            {typeLabels[nextVisit.type] ?? nextVisit.type}
            {nextVisit.technician ? ` · ${nextVisit.technician.user.name}` : " · Technician TBC"}
          </p>
        </Link>
      ) : (
        <div className="bg-gray-100 rounded-2xl px-5 py-4 text-center text-sm text-gray-400">
          No upcoming visits scheduled. Contact us to book your next service.
        </div>
      )}

      {/* Last service health */}
      {lastSigned?.report && (
        <div className={`bg-white rounded-2xl border p-6 ${health.bg}`}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-700">Last service health</p>
            <span className={`text-sm font-bold ${health.color}`}>{health.label}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {checkLabels.map(({ key, label }) => {
              const result = (lastSigned.report as any)[key] as string;
              const Icon = checkIcon[result] ?? MinusCircle;
              return (
                <div key={key} className="flex items-center gap-2 text-sm">
                  <Icon className={`w-4 h-4 shrink-0 ${checkColor[result]}`} />
                  <span className="text-gray-600">{label}</span>
                  {result !== "NOT_CHECKED" && (
                    <span className={`ml-auto text-xs font-medium ${checkColor[result]}`}>
                      {result.charAt(0) + result.slice(1).toLowerCase()}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Last checked: {new Date(lastSigned.scheduledAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            {lastSigned.technician ? ` by ${lastSigned.technician.user.name}` : ""}
          </p>
        </div>
      )}

      {/* Visit history */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">Visit history</h2>
          <span className="text-xs text-gray-400">{property.visits.length} visit{property.visits.length !== 1 ? "s" : ""}</span>
        </div>

        {property.visits.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 px-6 py-10 text-sm text-gray-400 text-center">
            No visits recorded yet for this property.
          </div>
        ) : (
          <div className="space-y-3">
            {property.visits.map((v) => {
              const reportChecks = v.report?.signedByTechnician
                ? [
                    { label: "Pipes",      result: v.report.pipesCheck },
                    { label: "Heating",    result: v.report.heatingCheck },
                    { label: "Water pump", result: v.report.waterPumpCheck },
                    { label: "Cylinder",   result: v.report.cylinderCheck },
                    { label: "Pressure",   result: v.report.pressureCheck },
                    { label: "Leakage",    result: v.report.leakageCheck },
                    { label: "Electrical", result: v.report.electricalCheck },
                    { label: "Boiler",     result: v.report.boilerCheck },
                  ].filter((c) => c.result !== "NOT_CHECKED")
                : [];

              return (
                <Link
                  key={v.id}
                  href={`/portal/visits/${v.id}`}
                  className="block bg-white rounded-2xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
                >
                  {/* Visit header row */}
                  <div className="flex items-center justify-between p-5">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900">
                        {new Date(v.scheduledAt).toLocaleDateString("en-GB", {
                          weekday: "long", day: "numeric", month: "long", year: "numeric",
                        })}
                      </p>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {typeLabels[v.type] ?? v.type}
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

                  {/* Inline report summary for signed visits */}
                  {v.report?.signedByTechnician && (
                    <div className="px-5 pb-5 pt-0">
                      <div className="border-t border-gray-100 pt-4">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Report summary</p>
                        {reportChecks.length > 0 ? (
                          <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
                            {reportChecks.map(({ label, result }) => {
                              const Icon = checkIcon[result] ?? MinusCircle;
                              return (
                                <div key={label} className="flex items-center gap-1.5">
                                  <Icon className={`w-3.5 h-3.5 shrink-0 ${checkColor[result]}`} />
                                  <span className="text-gray-500">{label}</span>
                                  <span className={`font-medium text-xs ${checkColor[result]}`}>
                                    {result.charAt(0) + result.slice(1).toLowerCase()}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400">No checks recorded.</p>
                        )}
                        {v.report.recommendations && (
                          <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                            <span className="font-medium">Recommendations:</span> {v.report.recommendations}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Pending report notice for completed but unsigned */}
                  {v.status === "COMPLETED" && v.report && !v.report.signedByTechnician && (
                    <div className="px-5 pb-4 pt-0">
                      <div className="border-t border-gray-100 pt-3">
                        <p className="text-xs text-gray-400 italic">Report being finalised by technician.</p>
                      </div>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
