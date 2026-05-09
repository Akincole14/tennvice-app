import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import TechnicianProfile from "./TechnicianProfile";
import AdminCertificates from "./AdminCertificates";

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

export default async function TechnicianDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const technician = await prisma.technician.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true, phone: true, image: true } },
      certificates: { orderBy: { createdAt: "desc" } },
      visits: {
        include: {
          property: { select: { address: true, postcode: true } },
          report: { select: { signedByTechnician: true, followUpRequired: true } },
        },
        orderBy: { scheduledAt: "desc" },
      },
    },
  });

  if (!technician) notFound();

  const now = new Date();
  const completed  = technician.visits.filter(v => v.status === "COMPLETED");
  const upcoming   = technician.visits.filter(v => v.status === "SCHEDULED" && new Date(v.scheduledAt) >= now);
  const inProgress = technician.visits.filter(v => v.status === "IN_PROGRESS");
  const cancelled  = technician.visits.filter(v => v.status === "CANCELLED");

  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/technicians" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900">
        <ArrowLeft className="w-4 h-4" />
        Back to technicians
      </Link>

      {/* Profile card with edit */}
      <TechnicianProfile technician={technician} />

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total visits",   value: technician.visits.length, color: "text-gray-900" },
          { label: "Completed",      value: completed.length,          color: "text-green-600" },
          { label: "Upcoming",       value: upcoming.length,           color: "text-blue-600" },
          { label: "Cancelled",      value: cancelled.length,          color: "text-red-500" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-200 px-4 py-4 text-center">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Upcoming visits */}
      {upcoming.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Upcoming visits</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {[...inProgress, ...upcoming].map(v => (
              <Link
                key={v.id}
                href={`/visits/${v.id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(v.scheduledAt).toLocaleDateString("en-GB", {
                      weekday: "short", day: "numeric", month: "short", year: "numeric",
                    })}
                    {" at "}
                    {new Date(v.scheduledAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {typeLabels[v.type] ?? v.type} · {v.property.address.split(",")[0]}
                  </p>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ml-3 ${statusColors[v.status]}`}>
                  {v.status.replace("_", " ")}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Visit history */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Visit history</h2>
          <span className="text-xs text-gray-400">{technician.visits.length} total</span>
        </div>
        {technician.visits.length === 0 ? (
          <p className="px-6 py-10 text-sm text-center text-gray-400">No visits assigned yet.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {technician.visits.map(v => (
              <Link
                key={v.id}
                href={`/visits/${v.id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(v.scheduledAt).toLocaleDateString("en-GB", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {typeLabels[v.type] ?? v.type} · {v.property.address.split(",")[0]}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-3 shrink-0">
                  {v.report?.followUpRequired && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium">Follow-up</span>
                  )}
                  {v.report?.signedByTechnician === false && v.status === "COMPLETED" && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 font-medium">Unsigned</span>
                  )}
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[v.status]}`}>
                    {v.status.replace("_", " ")}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Certificates */}
      <AdminCertificates certificates={technician.certificates} technicianId={technician.id} />
    </div>
  );
}
