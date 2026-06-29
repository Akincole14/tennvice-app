import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, CheckCircle, AlertTriangle, XCircle, MinusCircle,
  Home, Wrench, Calendar, FileText, Clock, Ban,
} from "lucide-react";
import SignOutButton from "@/components/SignOutButton";
import RescheduleButton from "@/components/portal/RescheduleButton";

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

const STEPS = ["Scheduled", "In progress", "Completed"] as const;

function StatusStepper({ status }: { status: string }) {
  if (status === "CANCELLED") {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 px-5 py-4">
        <div className="flex items-center gap-2 text-red-600">
          <Ban className="w-4 h-4" />
          <span className="text-sm font-medium">This visit was cancelled</span>
        </div>
      </div>
    );
  }

  const activeIndex =
    status === "SCHEDULED"   ? 0 :
    status === "IN_PROGRESS" ? 1 : 2;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 px-5 py-4">
      <div className="flex items-center">
        {STEPS.map((step, i) => {
          const done    = i < activeIndex;
          const current = i === activeIndex;
          return (
            <div key={step} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors
                  ${done    ? "bg-brand-600 border-brand-600 text-white" :
                    current ? "bg-white border-brand-600 text-brand-600" :
                              "bg-white border-gray-200 text-gray-300"}`}
                >
                  {done ? "✓" : i + 1}
                </div>
                <span className={`text-xs font-medium whitespace-nowrap
                  ${done || current ? "text-gray-700" : "text-gray-300"}`}
                >
                  {step}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 mb-4 rounded ${done ? "bg-brand-600" : "bg-gray-200"}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

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

  const userId = (session.user as any).id;
  if (visit.property.customer.user.id !== userId) notFound();

  const { report, property } = visit;

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

  const hasServices = report && (
    report.boilerServiced || report.systemFlushed ||
    report.cylinderFlushed || report.usageAdviceGiven
  );

  return (
    <div className="max-w-2xl mx-auto space-y-5 py-4 md:py-8">
      <div className="flex items-center justify-between gap-4">
        <Link href="/portal/visits" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" />
          Back to visit history
        </Link>
        <SignOutButton />
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {typeLabels[visit.type] ?? visit.type}
          </h1>
          <div className="flex items-center gap-1.5 text-gray-500 mt-1 text-sm">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            {new Date(visit.scheduledAt).toLocaleDateString("en-GB", {
              weekday: "long", day: "numeric", month: "long", year: "numeric",
            })}
            {" at "}
            {new Date(visit.scheduledAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
          </div>
          {visit.completedAt && (
            <div className="flex items-center gap-1.5 text-gray-400 mt-0.5 text-xs">
              <Clock className="w-3 h-3 shrink-0" />
              Completed {new Date(visit.completedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            </div>
          )}
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

      {/* Status stepper */}
      <StatusStepper status={visit.status} />

      {/* Property + Technician cards */}
      <div className="grid grid-cols-2 gap-4">
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
          <Link
            href={`/portal/properties/${property.id}`}
            className="mt-3 inline-block text-xs text-brand-600 font-medium hover:underline"
          >
            View property →
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            <Wrench className="w-3.5 h-3.5" /> Technician
          </div>
          {visit.technician ? (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-sm shrink-0">
                {visit.technician.user.name?.charAt(0) ?? "T"}
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{visit.technician.user.name}</p>
                {visit.technician.user.phone && (
                  <p className="text-xs text-gray-500 mt-0.5">{visit.technician.user.phone}</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 leading-snug">Your technician will be confirmed closer to the visit date.</p>
          )}
        </div>
      </div>

      {/* Upcoming visit — what to expect + reschedule */}
      {visit.status === "SCHEDULED" && (
        <div className="space-y-3">
          <div className="bg-brand-50 border border-brand-100 rounded-2xl p-5">
            <p className="text-sm font-semibold text-brand-800 mb-2">What to expect</p>
            <ul className="space-y-1.5 text-sm text-brand-700">
              <li className="flex items-start gap-2"><span className="mt-0.5">•</span>Please ensure someone is home during the visit.</li>
              <li className="flex items-start gap-2"><span className="mt-0.5">•</span>Your technician will carry out all checks included in your plan.</li>
              <li className="flex items-start gap-2"><span className="mt-0.5">•</span>A full report will be available here once your visit is completed.</li>
            </ul>
          </div>
          <div className="flex justify-end">
            <RescheduleButton
              visitId={visit.id}
              scheduledAt={visit.scheduledAt.toISOString()}
              technicianName={visit.technician?.user.name ?? null}
              propertyAddress={property.address}
            />
          </div>
        </div>
      )}

      {/* In progress notice */}
      {visit.status === "IN_PROGRESS" && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5 flex items-center gap-3 text-yellow-800">
          <Clock className="w-5 h-5 shrink-0 text-yellow-500" />
          <p className="text-sm font-medium">Your technician is currently on site. The report will appear here once the visit is complete.</p>
        </div>
      )}

      {/* Signed report */}
      {report?.signedByTechnician && (
        <div className="space-y-4">
          {/* Report header bar */}
          <div className="flex items-center justify-between">
            <p className="font-semibold text-gray-900">Inspection report</p>
            <div className="flex items-center gap-3">
              {report.signedAt && (
                <span className="text-xs text-gray-400">
                  Signed {new Date(report.signedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              )}
              <Link
                href={`/portal/report/${property.id}`}
                className="flex items-center gap-1.5 text-xs text-brand-600 font-medium border border-brand-200 px-3 py-1.5 rounded-lg hover:bg-brand-50 transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                Full service report
              </Link>
            </div>
          </div>

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
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-gray-900">{c.label}</span>
                          <span className={`text-xs font-semibold shrink-0 ${checkColors[c.result]}`}>
                            {c.result.charAt(0) + c.result.slice(1).toLowerCase()}
                          </span>
                        </div>
                        {c.notes && <p className="text-xs text-gray-500 mt-0.5 leading-snug">{c.notes}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Services performed */}
          {hasServices && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Services performed</p>
              <div className="flex flex-wrap gap-2">
                {report.boilerServiced   && <span className="text-sm px-3 py-1 bg-orange-50 text-orange-700 rounded-full">Boiler serviced</span>}
                {report.systemFlushed    && <span className="text-sm px-3 py-1 bg-sky-50 text-sky-700 rounded-full">System flushed</span>}
                {report.cylinderFlushed  && <span className="text-sm px-3 py-1 bg-sky-50 text-sky-700 rounded-full">Cylinder flushed</span>}
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
                  <p className="text-sm text-gray-700 leading-relaxed">{report.overallNotes}</p>
                </div>
              )}
              {report.recommendations && (
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">Recommendations</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{report.recommendations}</p>
                </div>
              )}
              {report.partsRequired && (
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">Parts required</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{report.partsRequired}</p>
                </div>
              )}
              {report.followUpRequired && (
                <div className="flex items-start gap-2.5 bg-amber-50 rounded-xl px-4 py-3 text-amber-700">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p className="text-sm font-medium">A follow-up visit has been recommended. We'll be in touch to arrange this.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Completed but report not yet signed */}
      {visit.status === "COMPLETED" && report && !report.signedByTechnician && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
          <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-600">Your report is being finalised</p>
          <p className="text-xs text-gray-400 mt-1">It will appear here once your technician has signed it off.</p>
        </div>
      )}

      {/* No report at all yet */}
      {visit.status === "COMPLETED" && !report && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
          <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-600">Report pending</p>
          <p className="text-xs text-gray-400 mt-1">Your technician will file the report shortly after the visit.</p>
        </div>
      )}
    </div>
  );
}
