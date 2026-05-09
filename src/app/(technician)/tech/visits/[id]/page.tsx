import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Home, User, Phone, Calendar, AlertTriangle } from "lucide-react";
import TechReportForm from "./TechReportForm";
import TechVisitStatusControl from "./TechVisitStatusControl";

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

export default async function TechVisitDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const userId = (session.user as any).id as string;
  const { id } = await params;

  const technician = await prisma.technician.findUnique({ where: { userId } });
  if (!technician) redirect("/login");

  const visit = await prisma.visit.findUnique({
    where: { id },
    include: {
      property: {
        include: {
          customer: {
            include: { user: { select: { name: true, email: true, phone: true } } },
          },
        },
      },
      report: true,
    },
  });

  if (!visit || visit.technicianId !== technician.id) notFound();

  const customer = visit.property.customer;
  const canStartVisit = visit.status === "SCHEDULED";
  const canFileReport = visit.status === "IN_PROGRESS" || visit.status === "COMPLETED";
  const reportSigned  = visit.report?.signedByTechnician ?? false;

  return (
    <div className="max-w-2xl space-y-6">
      <Link href="/tech/visits" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900">
        <ArrowLeft className="w-4 h-4" />
        Back to my visits
      </Link>

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
          <p className="font-semibold text-gray-900 leading-snug">{visit.property.address}</p>
          <p className="text-sm text-gray-500 mt-0.5">{visit.property.postcode}</p>
          {(visit.property as any).propertyType && (
            <p className="text-sm text-gray-500">
              {(visit.property as any).propertyType}
              {(visit.property as any).bedrooms ? ` · ${(visit.property as any).bedrooms} bed` : ""}
            </p>
          )}
          {visit.property.notes && (
            <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mt-3 leading-snug">
              {visit.property.notes}
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
            <a
              href={`tel:${customer.user.phone}`}
              className="inline-flex items-center gap-1.5 text-sm text-brand-600 font-medium mt-2 hover:underline"
            >
              <Phone className="w-3.5 h-3.5" /> {customer.user.phone}
            </a>
          )}
        </div>
      </div>

      {/* Status action — start visit button */}
      {canStartVisit && (
        <TechVisitStatusControl visitId={visit.id} currentStatus={visit.status} />
      )}

      {/* Report form */}
      {canFileReport && !reportSigned && (
        <TechReportForm visitId={visit.id} existingReport={visit.report} />
      )}

      {/* Signed report — read-only */}
      {reportSigned && visit.report && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 text-green-700 mb-1">
            <AlertTriangle className="w-4 h-4" />
            <p className="text-sm font-semibold">Report signed and submitted</p>
          </div>
          <p className="text-xs text-green-600">
            This visit is complete. The report has been signed and is visible to the customer.
          </p>
        </div>
      )}

      {/* Not yet started */}
      {visit.status === "SCHEDULED" && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 text-sm text-blue-700">
          Start the visit when you arrive on site. You'll be able to file the report once the visit is in progress.
        </div>
      )}

      {visit.status === "CANCELLED" && (
        <div className="bg-gray-100 rounded-2xl p-5 text-sm text-gray-500 text-center">
          This visit was cancelled.
        </div>
      )}
    </div>
  );
}
