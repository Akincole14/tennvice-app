import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle, AlertTriangle, XCircle, MinusCircle } from "lucide-react";

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

const checkIcons: Record<string, React.ElementType> = {
  PASS:        CheckCircle,
  ADVISORY:    AlertTriangle,
  FAIL:        XCircle,
  NOT_CHECKED: MinusCircle,
};

const checkColors: Record<string, string> = {
  PASS:        "text-green-600",
  ADVISORY:    "text-amber-500",
  FAIL:        "text-red-600",
  NOT_CHECKED: "text-gray-300",
};

export default async function CustomerVisitDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const { id } = await params;

  const visit = await prisma.visit.findUnique({
    where: { id },
    include: {
      property: {
        include: { customer: { include: { user: { select: { id: true } } } } },
      },
      technician: { include: { user: { select: { name: true, phone: true } } } },
      report: true,
    },
  });

  if (!visit) notFound();

  // Ensure this visit belongs to the logged-in customer
  const userId = (session.user as any).id;
  if (visit.property.customer.user.id !== userId) notFound();

  const { report } = visit;

  const checks = report
    ? [
        { label: "Pipes",      result: report.pipesCheck,      notes: report.pipesNotes },
        { label: "Heating",    result: report.heatingCheck,    notes: report.heatingNotes },
        { label: "Water pump", result: report.waterPumpCheck,  notes: report.waterPumpNotes },
        { label: "Cylinder",   result: report.cylinderCheck,   notes: report.cylinderNotes },
        { label: "Pressure",   result: report.pressureCheck,   notes: report.pressureNotes },
        { label: "Leakage",    result: report.leakageCheck,    notes: report.leakageNotes },
        { label: "Electrical", result: report.electricalCheck, notes: report.electricalNotes },
        { label: "Boiler",     result: report.boilerCheck,     notes: report.boilerNotes },
      ].filter((c) => c.result !== "NOT_CHECKED")
    : [];

  return (
    <div className="max-w-2xl space-y-6">
      <Link href="/portal/visits" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900">
        <ArrowLeft className="w-4 h-4" />
        Back to visit history
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {typeLabels[visit.type] ?? visit.type}
          </h1>
          <p className="text-gray-500 mt-1">
            {new Date(visit.scheduledAt).toLocaleDateString("en-GB", {
              weekday: "long", day: "numeric", month: "long", year: "numeric",
            })}
            {" at "}
            {new Date(visit.scheduledAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
          </p>
          <p className="text-sm text-gray-400 mt-0.5">{visit.property.address}, {visit.property.postcode}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {visit.isEmergency && (
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700">Emergency</span>
          )}
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[visit.status]}`}>
            {visit.status.replace("_", " ")}
          </span>
        </div>
      </div>

      {/* Technician */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Your technician</p>
        {visit.technician ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-sm">
              {visit.technician.user.name?.charAt(0) ?? "T"}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{visit.technician.user.name}</p>
              {visit.technician.user.phone && (
                <p className="text-sm text-gray-500">{visit.technician.user.phone}</p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Your technician will be confirmed closer to the visit date.</p>
        )}
      </div>

      {/* Report */}
      {report && report.signedByTechnician ? (
        <div className="space-y-5">
          {/* Check results */}
          {checks.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Inspection results</p>
              <div className="space-y-3">
                {checks.map((c) => {
                  const Icon = checkIcons[c.result] ?? MinusCircle;
                  return (
                    <div key={c.label} className="flex items-start gap-3">
                      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${checkColors[c.result]}`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900">{c.label}</span>
                          <span className={`text-xs font-semibold ${checkColors[c.result]}`}>
                            {c.result.charAt(0) + c.result.slice(1).toLowerCase()}
                          </span>
                        </div>
                        {c.notes && <p className="text-xs text-gray-500 mt-0.5">{c.notes}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Services performed */}
          {(report.boilerServiced || report.systemFlushed || report.cylinderFlushed || report.usageAdviceGiven) && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Services performed</p>
              <div className="flex flex-wrap gap-2">
                {report.boilerServiced && <span className="text-sm px-3 py-1 bg-orange-50 text-orange-700 rounded-full">Boiler serviced</span>}
                {report.systemFlushed && <span className="text-sm px-3 py-1 bg-sky-50 text-sky-700 rounded-full">System flushed</span>}
                {report.cylinderFlushed && <span className="text-sm px-3 py-1 bg-sky-50 text-sky-700 rounded-full">Cylinder flushed</span>}
                {report.usageAdviceGiven && <span className="text-sm px-3 py-1 bg-purple-50 text-purple-700 rounded-full">Usage advice given</span>}
              </div>
            </div>
          )}

          {/* Notes */}
          {(report.overallNotes || report.recommendations || report.partsRequired || report.followUpRequired) && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Notes & recommendations</p>
              {report.overallNotes && (
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">Overall notes</p>
                  <p className="text-sm text-gray-700">{report.overallNotes}</p>
                </div>
              )}
              {report.recommendations && (
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">Recommendations</p>
                  <p className="text-sm text-gray-700">{report.recommendations}</p>
                </div>
              )}
              {report.partsRequired && (
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">Parts required</p>
                  <p className="text-sm text-gray-700">{report.partsRequired}</p>
                </div>
              )}
              {report.followUpRequired && (
                <div className="flex items-center gap-2 bg-amber-50 rounded-xl px-4 py-3 text-amber-700">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <p className="text-sm font-medium">A follow-up visit has been recommended. We'll be in touch to arrange this.</p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : visit.status === "COMPLETED" ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center text-gray-400 text-sm">
          Your report is being finalised and will appear here shortly.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center text-gray-400 text-sm">
          The full inspection report will be available here after your visit is completed.
        </div>
      )}
    </div>
  );
}
