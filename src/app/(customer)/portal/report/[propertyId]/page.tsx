import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PrintButton from "./PrintButton";
import SignOutButton from "@/components/SignOutButton";

const typeLabels: Record<string, string> = {
  ROUTINE_PLUMBING:   "Routine Plumbing Inspection",
  ROUTINE_ELECTRICAL: "Routine Electrical Inspection",
  ROUTINE_BOTH:       "Routine Plumbing & Electrical Inspection",
  BOILER_SERVICE:     "Boiler Service",
  EMERGENCY:          "Emergency Call-out",
};

const checkLabels = [
  { key: "pipesCheck",     notesKey: "pipesNotes",     label: "Pipes" },
  { key: "heatingCheck",   notesKey: "heatingNotes",   label: "Heating" },
  { key: "waterPumpCheck", notesKey: "waterPumpNotes", label: "Water pump" },
  { key: "cylinderCheck",  notesKey: "cylinderNotes",  label: "Cylinder" },
  { key: "pressureCheck",  notesKey: "pressureNotes",  label: "Pressure" },
  { key: "leakageCheck",   notesKey: "leakageNotes",   label: "Leakage" },
  { key: "electricalCheck",notesKey: "electricalNotes",label: "Electrical" },
  { key: "boilerCheck",    notesKey: "boilerNotes",    label: "Boiler" },
];

const resultStyles: Record<string, string> = {
  PASS:        "text-green-700 font-semibold",
  ADVISORY:    "text-amber-600 font-semibold",
  FAIL:        "text-red-600 font-semibold",
  NOT_CHECKED: "text-gray-400",
};

async function getPropertyReport(propertyId: string, userId: string, isAdmin: boolean) {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    include: {
      customer: {
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
        },
      },
      visits: {
        where: { status: "COMPLETED", report: { signedByTechnician: true } },
        include: {
          technician: { include: { user: { select: { name: true } } } },
          report: true,
        },
        orderBy: { scheduledAt: "asc" },
      },
    },
  });

  if (!property) return null;
  if (!isAdmin && property.customer.user.id !== userId) return null;
  return property;
}

export default async function ServiceReportPage({ params }: { params: Promise<{ propertyId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const { propertyId } = await params;
  const userId = (session.user as any).id;
  const role = (session.user as any).role;
  const isAdmin = role === "ADMIN" || role === "TECHNICIAN";

  const property = await getPropertyReport(propertyId, userId, isAdmin);
  if (!property) notFound();

  const { customer, visits } = property;
  const generatedAt = new Date();

  const backHref = isAdmin ? `/properties` : `/portal`;

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-4 md:py-8">
      {/* Screen-only controls */}
      <div className="flex items-center justify-between print:hidden">
        <Link href={backHref} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <div className="flex items-center gap-3">
          <SignOutButton />
          <PrintButton />
        </div>
      </div>

      {/* ── Report document ── */}
      <div id="service-report" className="bg-white rounded-2xl border border-gray-200 p-8 print:rounded-none print:border-0 print:p-0 space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-200 pb-6">
          <div>
            <p className="text-2xl font-bold text-brand-700">Tennvice</p>
            <p className="text-sm text-gray-500 mt-0.5">Home Maintenance Subscription</p>
          </div>
          <div className="text-right text-sm text-gray-500">
            <p className="font-semibold text-gray-900">Service History Report</p>
            <p>Generated: {generatedAt.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
            <p className="text-xs text-gray-400 mt-1">For insurance purposes</p>
          </div>
        </div>

        {/* Property & customer */}
        <div className="grid grid-cols-2 gap-8">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Property</p>
            <p className="font-semibold text-gray-900">{property.address}</p>
            <p className="text-sm text-gray-600">{property.postcode}</p>
            <p className="text-sm text-gray-600">{property.propertyType}{property.bedrooms ? ` · ${property.bedrooms} bedrooms` : ""}</p>
            <p className="text-sm text-gray-600 mt-1">
              {(property as any).ownershipType === "TENANT" ? "Tenant-occupied" : "Owner-occupied"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Customer</p>
            <p className="font-semibold text-gray-900">{customer.user.name}</p>
            <p className="text-sm text-gray-600">{customer.user.email}</p>
            {customer.user.phone && <p className="text-sm text-gray-600">{customer.user.phone}</p>}
            <p className="text-sm text-gray-500 mt-1">
              {customer.subscriptionTier.charAt(0) + customer.subscriptionTier.slice(1).toLowerCase()} plan ·{" "}
              <span className={customer.subscriptionStatus === "ACTIVE" ? "text-green-600" : "text-red-500"}>
                {customer.subscriptionStatus.charAt(0) + customer.subscriptionStatus.slice(1).toLowerCase()}
              </span>
            </p>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-4 bg-gray-50 rounded-xl p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{visits.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">Completed visits</p>
          </div>
          <div className="text-center border-x border-gray-200">
            <p className="text-2xl font-bold text-gray-900">
              {visits.filter((v) => v.report?.followUpRequired).length}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Follow-ups raised</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {visits.length > 0
                ? new Date(visits[0].scheduledAt).toLocaleDateString("en-GB", { month: "short", year: "numeric" })
                : "—"}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">First service</p>
          </div>
        </div>

        {/* Visit history */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Complete service history</p>

          {visits.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">No completed visits on record for this property.</p>
          ) : (
            <div className="space-y-6">
              {visits.map((v, idx) => (
                <div key={v.id} className="border border-gray-200 rounded-xl overflow-hidden print:break-inside-avoid">
                  {/* Visit header */}
                  <div className="bg-gray-50 px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">
                        Visit {idx + 1} — {typeLabels[v.type] ?? v.type}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(v.scheduledAt).toLocaleDateString("en-GB", {
                          weekday: "long", day: "numeric", month: "long", year: "numeric",
                        })}
                        {v.technician ? ` · ${v.technician.user.name}` : ""}
                      </p>
                    </div>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">Completed</span>
                  </div>

                  {v.report && (
                    <div className="px-5 py-4 space-y-4">
                      {/* Check results */}
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Inspection checks</p>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-1.5">
                          {checkLabels.map(({ key, notesKey, label }) => {
                            const result = (v.report as any)[key] as string;
                            const notes = (v.report as any)[notesKey] as string | null;
                            if (result === "NOT_CHECKED") return null;
                            return (
                              <div key={key}>
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-600">{label}</span>
                                  <span className={resultStyles[result]}>
                                    {result.charAt(0) + result.slice(1).toLowerCase()}
                                  </span>
                                </div>
                                {notes && <p className="text-xs text-gray-400 mt-0.5">{notes}</p>}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Services */}
                      {(v.report.boilerServiced || v.report.systemFlushed || v.report.cylinderFlushed || v.report.usageAdviceGiven) && (
                        <div>
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Services performed</p>
                          <div className="flex flex-wrap gap-1.5 text-xs">
                            {v.report.boilerServiced   && <span className="px-2 py-0.5 bg-orange-50 text-orange-700 rounded-full">Boiler serviced</span>}
                            {v.report.systemFlushed    && <span className="px-2 py-0.5 bg-sky-50 text-sky-700 rounded-full">System flushed</span>}
                            {v.report.cylinderFlushed  && <span className="px-2 py-0.5 bg-sky-50 text-sky-700 rounded-full">Cylinder flushed</span>}
                            {v.report.usageAdviceGiven && <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full">Usage advice given</span>}
                          </div>
                        </div>
                      )}

                      {/* Notes */}
                      {(v.report.overallNotes || v.report.recommendations || v.report.partsRequired) && (
                        <div className="space-y-1.5 text-sm">
                          {v.report.overallNotes && (
                            <p><span className="font-medium text-gray-700">Notes:</span> <span className="text-gray-600">{v.report.overallNotes}</span></p>
                          )}
                          {v.report.recommendations && (
                            <p><span className="font-medium text-gray-700">Recommendations:</span> <span className="text-gray-600">{v.report.recommendations}</span></p>
                          )}
                          {v.report.partsRequired && (
                            <p><span className="font-medium text-gray-700">Parts required:</span> <span className="text-gray-600">{v.report.partsRequired}</span></p>
                          )}
                        </div>
                      )}

                      {v.report.followUpRequired && (
                        <p className="text-xs text-amber-700 font-medium bg-amber-50 rounded-lg px-3 py-2">Follow-up visit recommended</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer / declaration */}
        <div className="border-t border-gray-200 pt-6 space-y-2 text-xs text-gray-400">
          <p className="font-semibold text-gray-600">Declaration</p>
          <p>
            This report has been generated by Tennvice and accurately reflects the service history recorded
            for the above property. All visits listed were carried out by qualified Tennvice technicians
            and signed off upon completion. This document may be submitted as supporting evidence for
            insurance claims, property sales, or landlord compliance records.
          </p>
          <p className="mt-2">Tennvice · home@tennvice.com · tennvice.com</p>
        </div>

      </div>
    </div>
  );
}
