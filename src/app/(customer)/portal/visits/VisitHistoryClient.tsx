"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

const statusColors: Record<string, string> = {
  SCHEDULED:   "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-yellow-100 text-yellow-700",
  COMPLETED:   "bg-green-100 text-green-700",
  CANCELLED:   "bg-red-100 text-red-700",
};

const typeLabels: Record<string, string> = {
  ROUTINE_PLUMBING:   "Routine Plumbing",
  ROUTINE_ELECTRICAL: "Routine Electrical",
  ROUTINE_BOTH:       "Plumbing & Electrical",
  BOILER_SERVICE:     "Boiler Service",
  EMERGENCY:          "Emergency",
};

const checkColors: Record<string, string> = {
  PASS:        "text-green-600",
  ADVISORY:    "text-amber-600",
  FAIL:        "text-red-600",
  NOT_CHECKED: "text-gray-400",
};

type Visit = {
  id: string;
  scheduledAt: Date;
  status: string;
  type: string;
  isEmergency: boolean;
  property: { id: string; address: string; postcode: string };
  technician: { user: { name: string | null } } | null;
  report: {
    signedByTechnician: boolean;
    followUpRequired: boolean;
    pipesCheck: string;
    heatingCheck: string;
    electricalCheck: string;
    boilerCheck: string;
    recommendations: string | null;
  } | null;
};

export default function VisitHistoryClient({ visits }: { visits: Visit[] }) {
  const [propertyFilter, setPropertyFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Unique properties for dropdown
  const properties = Array.from(
    new Map(visits.map((v) => [v.property.id, v.property])).values()
  );

  const filtered = visits.filter((v) => {
    const matchesProp   = propertyFilter === "ALL" || v.property.id === propertyFilter;
    const matchesStatus = statusFilter === "ALL" || v.status === statusFilter;
    return matchesProp && matchesStatus;
  });

  const completed = filtered.filter((v) => v.status === "COMPLETED").length;
  const upcoming  = filtered.filter((v) => v.status === "SCHEDULED").length;
  const cancelled = filtered.filter((v) => v.status === "CANCELLED").length;

  const selectedProperty = properties.find((p) => p.id === propertyFilter);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Property dropdown */}
        <div className="relative">
          <select
            value={propertyFilter}
            onChange={(e) => setPropertyFilter(e.target.value)}
            className="appearance-none bg-white border border-gray-300 rounded-xl pl-4 pr-9 py-2.5 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer min-w-52"
          >
            <option value="ALL">All properties</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.address.split(",")[0]}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        {/* Status filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none bg-white border border-gray-300 rounded-xl pl-4 pr-9 py-2.5 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
          >
            <option value="ALL">All statuses</option>
            <option value="SCHEDULED">Upcoming</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        {/* Active property label + report link */}
        {selectedProperty && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-gray-500">{selectedProperty.address}</span>
            <Link
              href={`/portal/report/${selectedProperty.id}`}
              className="text-xs text-brand-600 font-medium border border-brand-200 px-3 py-1.5 rounded-lg hover:bg-brand-50 transition-colors"
            >
              Service report
            </Link>
          </div>
        )}
      </div>

      {/* Stats — reflect current filter */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Showing",   value: filtered.length, color: "text-gray-900" },
          { label: "Completed", value: completed,        color: "text-green-600" },
          { label: "Upcoming",  value: upcoming,         color: "text-blue-600" },
          { label: "Cancelled", value: cancelled,        color: "text-red-500" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-200 px-4 py-4 text-center">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Visit list */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm bg-white rounded-2xl border border-gray-200">
          No visits match your selection.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((v) => (
            <Link
              key={v.id}
              href={`/portal/visits/${v.id}`}
              className="block bg-white rounded-2xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between p-5">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900">
                    {new Date(v.scheduledAt).toLocaleDateString("en-GB", {
                      weekday: "long", day: "numeric", month: "long", year: "numeric",
                    })}
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {typeLabels[v.type] ?? v.type} · {v.property.address.split(",")[0]}
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

              {v.report?.signedByTechnician && (
                <div className="px-5 pb-5 pt-0">
                  <div className="border-t border-gray-100 pt-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Report summary</p>
                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                      {[
                        ["Pipes",      v.report.pipesCheck],
                        ["Heating",    v.report.heatingCheck],
                        ["Electrical", v.report.electricalCheck],
                        ["Boiler",     v.report.boilerCheck],
                      ].filter(([, r]) => r !== "NOT_CHECKED").map(([label, result]) => (
                        <div key={label as string} className="flex items-center gap-1.5">
                          <span className="text-gray-500">{label}</span>
                          <span className={`font-medium ${checkColors[result as string]}`}>
                            {(result as string).charAt(0) + (result as string).slice(1).toLowerCase()}
                          </span>
                        </div>
                      ))}
                    </div>
                    {v.report.recommendations && (
                      <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                        <span className="font-medium">Recommendations:</span> {v.report.recommendations}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400 text-center">
        Showing {filtered.length} of {visits.length} visits
      </p>
    </div>
  );
}
