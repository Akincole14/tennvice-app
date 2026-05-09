"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";

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

type Visit = {
  id: string;
  scheduledAt: Date;
  status: string;
  type: string;
  isEmergency: boolean;
  property: { address: string; postcode: string; customer: { user: { name: string | null } } };
  report: { signedByTechnician: boolean; followUpRequired: boolean } | null;
};

export default function TechVisitsClient({ visits }: { visits: Visit[] }) {
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filtered = visits.filter(v => statusFilter === "ALL" || v.status === statusFilter);

  const counts = {
    all:        visits.length,
    scheduled:  visits.filter(v => v.status === "SCHEDULED").length,
    inProgress: visits.filter(v => v.status === "IN_PROGRESS").length,
    completed:  visits.filter(v => v.status === "COMPLETED").length,
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "All",         value: counts.all,        color: "text-gray-900",  filter: "ALL" },
          { label: "Upcoming",    value: counts.scheduled,  color: "text-blue-600",  filter: "SCHEDULED" },
          { label: "In progress", value: counts.inProgress, color: "text-yellow-600",filter: "IN_PROGRESS" },
          { label: "Completed",   value: counts.completed,  color: "text-green-600", filter: "COMPLETED" },
        ].map(({ label, value, color, filter }) => (
          <button
            key={filter}
            onClick={() => setStatusFilter(filter)}
            className={`bg-white rounded-2xl border px-4 py-3 text-center transition-all ${
              statusFilter === filter ? "border-brand-400 ring-1 ring-brand-400" : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </button>
        ))}
      </div>

      {/* Filter dropdown */}
      <div className="relative inline-block">
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
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

      {/* Visit list */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 px-6 py-10 text-center text-sm text-gray-400">
          No visits match this filter.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(v => (
            <Link
              key={v.id}
              href={`/tech/visits/${v.id}`}
              className="flex items-center justify-between bg-white rounded-2xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all p-5 group"
            >
              <div className="min-w-0">
                <p className="font-semibold text-gray-900">
                  {new Date(v.scheduledAt).toLocaleDateString("en-GB", {
                    weekday: "long", day: "numeric", month: "long", year: "numeric",
                  })}
                </p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {new Date(v.scheduledAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                  {" · "}
                  {typeLabels[v.type] ?? v.type}
                  {" · "}
                  {v.property.address.split(",")[0]}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{v.property.customer.user.name ?? "Unknown customer"}</p>
              </div>
              <div className="flex flex-col items-end gap-1.5 ml-4 shrink-0">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[v.status]}`}>
                  {v.status.replace("_", " ")}
                </span>
                {v.status === "COMPLETED" && v.report && !v.report.signedByTechnician && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                    Report pending
                  </span>
                )}
                {v.report?.followUpRequired && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-orange-50 text-orange-700">
                    Follow-up needed
                  </span>
                )}
                {v.isEmergency && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-700">
                    Emergency
                  </span>
                )}
              </div>
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
