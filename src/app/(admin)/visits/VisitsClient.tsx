"use client";

import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import ScheduleVisitModal from "@/components/admin/ScheduleVisitModal";

const statusColors: Record<string, string> = {
  SCHEDULED:   "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-yellow-100 text-yellow-700",
  COMPLETED:   "bg-green-100 text-green-700",
  CANCELLED:   "bg-red-100 text-red-700",
};

const typeColors: Record<string, string> = {
  ROUTINE_PLUMBING:   "bg-sky-50 text-sky-700",
  ROUTINE_ELECTRICAL: "bg-violet-50 text-violet-700",
  ROUTINE_BOTH:       "bg-indigo-50 text-indigo-700",
  BOILER_SERVICE:     "bg-orange-50 text-orange-700",
  EMERGENCY:          "bg-red-50 text-red-700",
};

const typeLabels: Record<string, string> = {
  ROUTINE_PLUMBING:   "Plumbing",
  ROUTINE_ELECTRICAL: "Electrical",
  ROUTINE_BOTH:       "Plumbing & Electrical",
  BOILER_SERVICE:     "Boiler service",
  EMERGENCY:          "Emergency",
};

type Visit = {
  id: string;
  scheduledAt: Date;
  status: string;
  type: string;
  isEmergency: boolean;
  property: {
    address: string;
    customer: { user: { name: string | null } };
  };
  technician: { user: { name: string | null } } | null;
  report: { signedByTechnician: boolean; followUpRequired: boolean } | null;
};

type Property = { id: string; address: string; postcode: string; customer: { user: { name: string | null } } };
type Technician = { id: string; user: { name: string | null } };

export default function VisitsClient({
  visits,
  properties,
  technicians,
}: {
  visits: Visit[];
  properties: Property[];
  technicians: Technician[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [techFilter, setTechFilter] = useState("ALL");

  const filtered = visits.filter((v) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      v.property.customer.user.name?.toLowerCase().includes(q) ||
      v.property.address.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "ALL" || v.status === statusFilter;
    const matchesType = typeFilter === "ALL" || v.type === typeFilter;
    const matchesTech =
      techFilter === "ALL" ||
      (techFilter === "UNASSIGNED" && !v.technician) ||
      v.technician?.user.name === techFilter;
    return matchesSearch && matchesStatus && matchesType && matchesTech;
  });

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer or address…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="ALL">All statuses</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="IN_PROGRESS">In progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="ALL">All types</option>
          {Object.entries(typeLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select
          value={techFilter}
          onChange={(e) => setTechFilter(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="ALL">All technicians</option>
          <option value="UNASSIGNED">Unassigned</option>
          {technicians.map((t) => (
            <option key={t.id} value={t.user.name ?? ""}>{t.user.name ?? "Unnamed"}</option>
          ))}
        </select>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 bg-brand-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-brand-700 ml-auto"
        >
          <Plus className="w-4 h-4" />
          Schedule visit
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-5 py-3 font-medium text-gray-500">Date & time</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Customer</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Type</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Technician</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Status</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Report</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-400">
                  No visits match your filters.
                </td>
              </tr>
            ) : (
              filtered.map((v) => (
                <tr
                  key={v.id}
                  onClick={() => router.push(`/visits/${v.id}`)}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <td className="px-5 py-3 text-gray-900 whitespace-nowrap">
                    <p>{new Date(v.scheduledAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
                    <p className="text-xs text-gray-400">{new Date(v.scheduledAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</p>
                  </td>
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-900">{v.property.customer.user.name ?? "—"}</p>
                    <p className="text-xs text-gray-400">{v.property.address}</p>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[v.type] ?? "bg-gray-100 text-gray-600"}`}>
                        {typeLabels[v.type] ?? v.type}
                      </span>
                      {v.isEmergency && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Emergency</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-600">
                    {v.technician ? v.technician.user.name : (
                      <span className="text-orange-500 font-medium">Unassigned</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[v.status]}`}>
                      {v.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                    {v.report ? (
                      <div className="flex flex-col gap-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium w-fit ${v.report.signedByTechnician ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                          {v.report.signedByTechnician ? "Signed" : "Unsigned"}
                        </span>
                        {v.report.followUpRequired && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600 w-fit">Follow-up</span>
                        )}
                      </div>
                    ) : v.status === "COMPLETED" || v.status === "IN_PROGRESS" ? (
                      <a
                        href={`/visits/${v.id}/report`}
                        className="text-brand-600 text-xs font-medium hover:underline"
                      >
                        Add report
                      </a>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400">
          Showing {filtered.length} of {visits.length} visits
        </div>
      </div>

      {open && (
        <ScheduleVisitModal
          properties={properties}
          technicians={technicians}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
