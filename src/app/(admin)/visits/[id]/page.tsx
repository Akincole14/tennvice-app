import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Home, User, Wrench, AlertTriangle, Eye } from "lucide-react";
import VisitStatusControls from "./VisitStatusControls";
import VisitActions from "./VisitActions";
import SignOutButton from "@/components/SignOutButton";

const typeLabels: Record<string, string> = {
  ROUTINE_PLUMBING:   "Routine — Plumbing",
  ROUTINE_ELECTRICAL: "Routine — Electrical",
  ROUTINE_BOTH:       "Routine — Plumbing & Electrical",
  BOILER_SERVICE:     "Boiler Service",
  EMERGENCY:          "Emergency",
};

const statusColors: Record<string, string> = {
  SCHEDULED:   "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-yellow-100 text-yellow-700",
  COMPLETED:   "bg-green-100 text-green-700",
  CANCELLED:   "bg-red-100 text-red-700",
};

const tierColors: Record<string, string> = {
  BASIC:      "bg-gray-100 text-gray-700",
  STANDARD:   "bg-blue-100 text-blue-700",
  PLUS:       "bg-purple-100 text-purple-700",
  PREMIUM:    "bg-amber-100 text-amber-700",
  ENTERPRISE: "bg-emerald-100 text-emerald-700",
};

const checkColors: Record<string, string> = {
  PASS:        "text-green-600",
  ADVISORY:    "text-amber-600",
  FAIL:        "text-red-600",
  NOT_CHECKED: "text-gray-400",
};

export default async function VisitDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [visit, technicians] = await Promise.all([
    prisma.visit.findUnique({
      where: { id },
      include: {
        property: {
          include: {
            customer: {
              include: { user: { select: { name: true, email: true, phone: true } } },
            },
          },
        },
        technician: { include: { user: { select: { name: true, email: true } } } },
        report: true,
      },
    }),
    prisma.technician.findMany({
      select: { id: true, user: { select: { name: true } } },
    }),
  ]);

  if (!visit) notFound();

  const { property, technician, report } = visit;
  const customer = property.customer;

  const reportChecks = report
    ? [
        { label: "Pipes",       result: report.pipesCheck,       notes: report.pipesNotes },
        { label: "Heating",     result: report.heatingCheck,     notes: report.heatingNotes },
        { label: "Water pump",  result: report.waterPumpCheck,   notes: report.waterPumpNotes },
        { label: "Cylinder",    result: report.cylinderCheck,    notes: report.cylinderNotes },
        { label: "Pressure",    result: report.pressureCheck,    notes: report.pressureNotes },
        { label: "Leakage",     result: report.leakageCheck,     notes: report.leakageNotes },
        { label: "Electrical",  result: report.electricalCheck,  notes: report.electricalNotes },
        { label: "Boiler",      result: report.boilerCheck,      notes: report.boilerNotes },
      ]
    : [];

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4 md:py-8">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4">
        <Link href="/visits" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" />
          Back to visits
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href={`/visits/${id}/customer-view`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 border border-brand-200 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-xl transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            Customer view
          </Link>
          <Link
            href={`/visits/${id}/tech-view`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 border border-brand-200 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-xl transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            Technician view
          </Link>
          <SignOutButton />
        </div>
      </div>

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
            {new Date(visit.scheduledAt).toLocaleTimeString("en-GB", {
              hour: "2-digit", minute: "2-digit",
            })}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {visit.isEmergency && (
            <span className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700">
              <AlertTriangle className="w-3.5 h-3.5" /> Emergency
            </span>
          )}
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[visit.status]}`}>
            {visit.status.replace("_", " ")}
          </span>
          <VisitActions
            visitId={visit.id}
            type={visit.type}
            scheduledAt={visit.scheduledAt}
            technicianId={visit.technician?.id ?? null}
            technicians={technicians}
          />
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Customer */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
            <User className="w-3.5 h-3.5" /> Customer
          </div>
          <p className="font-semibold text-gray-900">{customer.user.name ?? "—"}</p>
          <p className="text-sm text-gray-500">{customer.user.email}</p>
          {customer.user.phone && <p className="text-sm text-gray-500">{customer.user.phone}</p>}
          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${tierColors[customer.subscriptionTier]}`}>
            {customer.subscriptionTier.charAt(0) + customer.subscriptionTier.slice(1).toLowerCase()}
          </span>
        </div>

        {/* Property */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
            <Home className="w-3.5 h-3.5" /> Property
          </div>
          <p className="font-semibold text-gray-900">{property.address}</p>
          <p className="text-sm text-gray-500">{property.postcode}</p>
          <p className="text-sm text-gray-500">{property.propertyType}{property.bedrooms ? ` · ${property.bedrooms} bed` : ""}</p>
          <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${(property as any).ownershipType === "TENANT" ? "bg-blue-50 text-blue-700" : "bg-green-50 text-green-700"}`}>
            {(property as any).ownershipType === "TENANT" ? "Tenant" : "Owner"}
          </span>
          {property.notes && <p className="text-xs text-gray-400 italic">{property.notes}</p>}
        </div>

        {/* Technician */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
            <Wrench className="w-3.5 h-3.5" /> Technician
          </div>
          {technician ? (
            <>
              <p className="font-semibold text-gray-900">{technician.user.name}</p>
              <p className="text-sm text-gray-500">{technician.user.email}</p>
            </>
          ) : (
            <p className="text-orange-500 font-medium text-sm">Unassigned</p>
          )}
        </div>
      </div>

      {/* Status controls */}
      <VisitStatusControls visitId={visit.id} currentStatus={visit.status} />

      {/* Report */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Inspection report</h2>
          {report ? (
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${report.signedByTechnician ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                {report.signedByTechnician ? "Signed" : "Draft"}
              </span>
              <Link
                href={`/visits/${visit.id}/report`}
                className="text-xs text-brand-600 font-medium hover:underline"
              >
                {report.signedByTechnician ? "View" : "Edit report"}
              </Link>
            </div>
          ) : (
            <Link
              href={`/visits/${visit.id}/report`}
              className="text-sm text-brand-600 font-medium hover:underline"
            >
              + Add report
            </Link>
          )}
        </div>

        {report ? (
          <div className="p-6 space-y-6">
            {/* Check results */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Inspection checks</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {reportChecks.filter(c => c.result !== "NOT_CHECKED").map((c) => (
                  <div key={c.label} className="border border-gray-100 rounded-xl p-3">
                    <p className="text-xs text-gray-500">{c.label}</p>
                    <p className={`text-sm font-semibold ${checkColors[c.result]}`}>
                      {c.result.charAt(0) + c.result.slice(1).toLowerCase().replace("_", " ")}
                    </p>
                    {c.notes && <p className="text-xs text-gray-400 mt-1">{c.notes}</p>}
                  </div>
                ))}
                {reportChecks.every(c => c.result === "NOT_CHECKED") && (
                  <p className="text-sm text-gray-400 col-span-4">No checks recorded.</p>
                )}
              </div>
            </div>

            {/* Services */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Services performed</p>
              <div className="flex flex-wrap gap-2">
                {report.boilerServiced && <span className="text-xs px-2 py-1 bg-orange-50 text-orange-700 rounded-full">Boiler serviced</span>}
                {report.systemFlushed && <span className="text-xs px-2 py-1 bg-sky-50 text-sky-700 rounded-full">System flushed</span>}
                {report.cylinderFlushed && <span className="text-xs px-2 py-1 bg-sky-50 text-sky-700 rounded-full">Cylinder flushed</span>}
                {report.usageAdviceGiven && <span className="text-xs px-2 py-1 bg-purple-50 text-purple-700 rounded-full">Usage advice given</span>}
                {report.followUpRequired && <span className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded-full">Follow-up required</span>}
                {!report.boilerServiced && !report.systemFlushed && !report.cylinderFlushed && !report.usageAdviceGiven && !report.followUpRequired && (
                  <span className="text-sm text-gray-400">None recorded</span>
                )}
              </div>
            </div>

            {/* Notes */}
            {(report.overallNotes || report.recommendations || report.partsRequired) && (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Notes & recommendations</p>
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
          </div>
        ) : (
          <div className="px-6 py-10 text-center text-gray-400 text-sm">
            No report filed yet.{" "}
            <Link href={`/visits/${visit.id}/report`} className="text-brand-600 hover:underline">
              Add one now.
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
