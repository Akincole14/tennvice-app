import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Home, User, Phone, Calendar, AlertTriangle, CheckCircle, XCircle, MinusCircle, FileText } from "lucide-react";
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

const checkIcons: Record<string, React.ElementType> = {
  PASS:        CheckCircle,
  ADVISORY:    AlertTriangle,
  FAIL:        XCircle,
  NOT_CHECKED: MinusCircle,
};

const checkColors: Record<string, string> = {
  PASS:     "text-green-600",
  ADVISORY: "text-amber-500",
  FAIL:     "text-red-600",
  NOT_CHECKED: "text-gray-300",
};

const checkLabels = [
  { key: "pipesCheck",      notesKey: "pipesNotes",      label: "Pipes" },
  { key: "heatingCheck",    notesKey: "heatingNotes",    label: "Heating" },
  { key: "waterPumpCheck",  notesKey: "waterPumpNotes",  label: "Water pump" },
  { key: "cylinderCheck",   notesKey: "cylinderNotes",   label: "Cylinder" },
  { key: "pressureCheck",   notesKey: "pressureNotes",   label: "Pressure" },
  { key: "leakageCheck",    notesKey: "leakageNotes",    label: "Leakage" },
  { key: "electricalCheck", notesKey: "electricalNotes", label: "Electrical" },
  { key: "boilerCheck",     notesKey: "boilerNotes",     label: "Boiler" },
];

export default async function AdminVisitTechViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const visit = await prisma.visit.findUnique({
    where: { id },
    include: {
      property: {
        include: {
          customer: { include: { user: { select: { name: true, email: true, phone: true } } } },
        },
      },
      technician: { include: { user: { select: { name: true } } } },
      report: true,
    },
  });

  if (!visit) notFound();

  const { property, report } = visit;
  const customer = property.customer;
  const reportSigned = report?.signedByTechnician ?? false;

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-4 md:py-8">

      {/* Top bar */}
      <div className="flex items-center justify-between gap-4">
        <Link href={`/visits/${id}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" />
          Back to visit
        </Link>
        <SignOutButton />
      </div>

      {/* Admin badge */}
      <div>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200 px-2.5 py-1 rounded-full mb-3">
          Admin view — technician dashboard
        </span>
        <p className="text-sm text-gray-500">
          Viewing as{" "}
          <span className="font-medium text-gray-700">
            {visit.technician?.user.name ?? "Unassigned technician"}
          </span>
        </p>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{typeLabels[visit.type] ?? visit.type}</h1>
          <div className="flex items-center gap-1.5 text-gray-500 mt-1 text-sm">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            {new Date(visit.scheduledAt).toLocaleDateString("en-GB", {
              weekday: "long", day: "numeric", month: "long", year: "numeric",
            })}
            {" at "}
            {new Date(visit.scheduledAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap shrink-0">
          {visit.isEmergency && (
            <span className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700">
              <AlertTriangle className="w-3.5 h-3.5" /> Emergency
            </span>
          )}
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[visit.status]}`}>
            {visit.status.replace("_", " ")}
          </span>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 gap-4">
        {/* Property */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            <Home className="w-3.5 h-3.5" /> Property
          </div>
          <p className="font-semibold text-gray-900 leading-snug">{property.address}</p>
          <p className="text-sm text-gray-500 mt-0.5">{property.postcode}</p>
          {(property as any).propertyType && (
            <p className="text-sm text-gray-500">
              {(property as any).propertyType}
              {(property as any).bedrooms ? ` · ${(property as any).bedrooms} bed` : ""}
            </p>
          )}
          {property.notes && (
            <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mt-3 leading-snug">
              {property.notes}
            </p>
          )}
        </div>

        {/* Customer */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            <User className="w-3.5 h-3.5" /> Customer
          </div>
          <p className="font-semibold text-gray-900">{customer.user.name ?? "—"}</p>
          <p className="text-sm text-gray-500 mt-0.5">{customer.user.email}</p>
          {customer.user.phone && (
            <div className="inline-flex items-center gap-1.5 text-sm text-brand-600 font-medium mt-2">
              <Phone className="w-3.5 h-3.5" /> {customer.user.phone}
            </div>
          )}
        </div>
      </div>

      {/* Status notice */}
      {visit.status === "SCHEDULED" && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 text-sm text-blue-700">
          The technician would be able to start this visit on arrival. They can file the report once the visit is in progress.
        </div>
      )}

      {visit.status === "CANCELLED" && (
        <div className="bg-gray-100 rounded-2xl p-5 text-sm text-gray-500 text-center">
          This visit was cancelled.
        </div>
      )}

      {/* Signed report — read-only */}
      {reportSigned && report && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 text-green-700 mb-1">
            <CheckCircle className="w-4 h-4" />
            <p className="text-sm font-semibold">Report signed and submitted</p>
          </div>
          <p className="text-xs text-green-600">This visit is complete. The report is visible to the customer.</p>
        </div>
      )}

      {/* Report data */}
      {report && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Inspection report</h2>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${report.signedByTechnician ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                {report.signedByTechnician ? "Signed" : "Draft"}
              </span>
              <Link href={`/visits/${id}/report`} className="text-xs text-brand-600 font-medium hover:underline">
                Edit in admin
              </Link>
            </div>
          </div>
          <div className="p-5 space-y-5">
            {/* Checks */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Inspection checks</p>
              <div className="space-y-2.5">
                {checkLabels.map(({ key, notesKey, label }) => {
                  const result = (report as any)[key] as string;
                  const notes  = (report as any)[notesKey] as string | null;
                  if (result === "NOT_CHECKED") return null;
                  const Icon = checkIcons[result] ?? MinusCircle;
                  return (
                    <div key={key} className="flex items-start gap-3">
                      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${checkColors[result]}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-gray-900">{label}</span>
                          <span className={`text-xs font-semibold shrink-0 ${checkColors[result]}`}>
                            {result.charAt(0) + result.slice(1).toLowerCase()}
                          </span>
                        </div>
                        {notes && <p className="text-xs text-gray-500 mt-0.5">{notes}</p>}
                      </div>
                    </div>
                  );
                })}
                {checkLabels.every(({ key }) => (report as any)[key] === "NOT_CHECKED") && (
                  <p className="text-sm text-gray-400">No checks recorded.</p>
                )}
              </div>
            </div>

            {/* Services */}
            {(report.boilerServiced || report.systemFlushed || report.cylinderFlushed || report.usageAdviceGiven) && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Services performed</p>
                <div className="flex flex-wrap gap-2">
                  {report.boilerServiced   && <span className="text-xs px-3 py-1 bg-orange-50 text-orange-700 rounded-full">Boiler serviced</span>}
                  {report.systemFlushed    && <span className="text-xs px-3 py-1 bg-sky-50 text-sky-700 rounded-full">System flushed</span>}
                  {report.cylinderFlushed  && <span className="text-xs px-3 py-1 bg-sky-50 text-sky-700 rounded-full">Cylinder flushed</span>}
                  {report.usageAdviceGiven && <span className="text-xs px-3 py-1 bg-purple-50 text-purple-700 rounded-full">Usage advice given</span>}
                </div>
              </div>
            )}

            {/* Notes */}
            {(report.overallNotes || report.recommendations || report.partsRequired) && (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Notes</p>
                {report.overallNotes && (
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-0.5">Overall notes</p>
                    <p className="text-sm text-gray-700">{report.overallNotes}</p>
                  </div>
                )}
                {report.recommendations && (
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-0.5">Recommendations</p>
                    <p className="text-sm text-gray-700">{report.recommendations}</p>
                  </div>
                )}
                {report.partsRequired && (
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-0.5">Parts required</p>
                    <p className="text-sm text-gray-700">{report.partsRequired}</p>
                  </div>
                )}
              </div>
            )}

            {report.followUpRequired && (
              <div className="flex items-start gap-2 bg-amber-50 rounded-xl px-4 py-3 text-amber-700">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="text-sm font-medium">Follow-up visit recommended</p>
              </div>
            )}
          </div>
        </div>
      )}

      {!report && (visit.status === "IN_PROGRESS" || visit.status === "COMPLETED") && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
          <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-600">No report filed yet</p>
          <Link href={`/visits/${id}/report`} className="text-xs text-brand-600 font-medium hover:underline mt-1 inline-block">
            Add report in admin →
          </Link>
        </div>
      )}
    </div>
  );
}
