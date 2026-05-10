"use client";

import { useState, useMemo } from "react";
import { Search, FileText, FilePlus, AlertCircle } from "lucide-react";
import Link from "next/link";

const typeLabels: Record<string, string> = {
  ROUTINE_PLUMBING:   "Plumbing",
  ROUTINE_ELECTRICAL: "Electrical",
  ROUTINE_BOTH:       "Plumbing & Electrical",
  BOILER_SERVICE:     "Boiler service",
  EMERGENCY:          "Emergency",
};

const typeColors: Record<string, string> = {
  ROUTINE_PLUMBING:   "bg-sky-50 text-sky-700",
  ROUTINE_ELECTRICAL: "bg-violet-50 text-violet-700",
  ROUTINE_BOTH:       "bg-indigo-50 text-indigo-700",
  BOILER_SERVICE:     "bg-orange-50 text-orange-700",
  EMERGENCY:          "bg-red-50 text-red-700",
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
  technician: { id: string; user: { name: string | null } } | null;
  report: { id: string; signedByTechnician: boolean; followUpRequired: boolean } | null;
};

type Technician = { id: string; user: { name: string | null } };

type Stats = {
  needsReport: number;
  unsignedDrafts: number;
  signed: number;
  followUps: number;
};

// Report status for each visit
function reportBadge(v: Visit) {
  if (!v.report) {
    if (v.status === "COMPLETED" || v.status === "IN_PROGRESS") {
      return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600">Needs report</span>;
    }
    return <span className="text-xs text-gray-300">—</span>;
  }
  return (
    <div className="flex flex-col gap-1">
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium w-fit ${v.report.signedByTechnician ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
        {v.report.signedByTechnician ? "Signed" : "Unsigned draft"}
      </span>
      {v.report.followUpRequired && (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600 w-fit">Follow-up</span>
      )}
    </div>
  );
}

// CTA button for each visit
function reportAction(v: Visit) {
  if (!v.report) {
    if (v.status === "COMPLETED" || v.status === "IN_PROGRESS") {
      return (
        <Link
          href={`/visits/${v.id}/report`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
          onClick={e => e.stopPropagation()}
        >
          <FilePlus className="w-3.5 h-3.5" />
          Create report
        </Link>
      );
    }
    return null;
  }
  return (
    <Link
      href={`/visits/${v.id}/report`}
      className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
      onClick={e => e.stopPropagation()}
    >
      <FileText className="w-3.5 h-3.5" />
      {v.report.signedByTechnician ? "View report" : "Edit draft"}
    </Link>
  );
}

export default function ReportsClient({
  visits,
  technicians,
  stats,
}: {
  visits: Visit[];
  technicians: Technician[];
  stats: Stats;
}) {
  // Default: show visits that need attention (no report or unsigned)
  const [statusFilter, setStatusFilter] = useState("NEEDS_REPORT");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [techFilter, setTechFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return visits.filter(v => {
      // Status / report filter
      if (statusFilter === "NEEDS_REPORT") {
        if (v.report || (v.status !== "COMPLETED" && v.status !== "IN_PROGRESS")) return false;
      } else if (statusFilter === "UNSIGNED") {
        if (!v.report || v.report.signedByTechnician) return false;
      } else if (statusFilter === "SIGNED") {
        if (!v.report?.signedByTechnician) return false;
      } else if (statusFilter === "FOLLOW_UP") {
        if (!v.report?.followUpRequired) return false;
      } else if (statusFilter !== "ALL") {
        if (v.status !== statusFilter) return false;
      }

      if (typeFilter !== "ALL" && v.type !== typeFilter) return false;
      if (techFilter === "UNASSIGNED" && v.technician) return false;
      if (techFilter !== "ALL" && techFilter !== "UNASSIGNED" && v.technician?.id !== techFilter) return false;

      if (search) {
        const q = search.toLowerCase();
        if (
          !v.property.customer.user.name?.toLowerCase().includes(q) &&
          !v.property.address.toLowerCase().includes(q)
        ) return false;
      }

      return true;
    });
  }, [visits, statusFilter, typeFilter, techFilter, search]);

  const statTiles = [
    { label: "Needs report",    value: stats.needsReport,    color: "text-red-500",    filter: "NEEDS_REPORT" },
    { label: "Unsigned drafts", value: stats.unsignedDrafts, color: "text-amber-500",  filter: "UNSIGNED" },
    { label: "Signed",          value: stats.signed,         color: "text-green-600",  filter: "SIGNED" },
    { label: "Follow-ups",      value: stats.followUps,      color: "text-orange-500", filter: "FOLLOW_UP" },
  ];

  return (
    <>
      {/* Stat tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-4">
        {statTiles.map(({ label, value, color, filter }) => (
          <button
            key={filter}
            onClick={() => setStatusFilter(f => f === filter ? "ALL" : filter)}
            className={`bg-white rounded-2xl border px-3 py-3 md:px-5 md:py-4 text-left transition-all ${
              statusFilter === filter
                ? "border-brand-400 ring-2 ring-brand-100"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <p className={`text-xl md:text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </button>
        ))}
      </div>

      {/* Attention banner when there are visits needing reports */}
      {stats.needsReport > 0 && statusFilter !== "NEEDS_REPORT" && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>
            <strong>{stats.needsReport}</strong> completed or in-progress visit{stats.needsReport !== 1 ? "s" : ""} still need{stats.needsReport === 1 ? "s" : ""} a report.
          </span>
          <button
            onClick={() => setStatusFilter("NEEDS_REPORT")}
            className="ml-auto text-xs font-semibold underline hover:no-underline"
          >
            Show them
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="space-y-2 md:space-y-0 md:flex md:flex-wrap md:items-center md:gap-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search reports…"
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={`shrink-0 ${selectCls}`}>
            <option value="ALL">All visits</option>
            <option value="NEEDS_REPORT">Needs report</option>
            <option value="UNSIGNED">Unsigned</option>
            <option value="SIGNED">Signed</option>
            <option value="FOLLOW_UP">Follow-ups</option>
            <option disabled>──────────</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
        <div className="hidden md:flex gap-3">
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className={selectCls}>
            <option value="ALL">All types</option>
            {Object.entries(typeLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select value={techFilter} onChange={e => setTechFilter(e.target.value)} className={selectCls}>
            <option value="ALL">All technicians</option>
            <option value="UNASSIGNED">Unassigned</option>
            {technicians.map(t => (
              <option key={t.id} value={t.id}>{t.user.name ?? "Unnamed"}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
        {filtered.length === 0 ? (
          <p className="text-center py-12 text-sm text-gray-400">No visits match your filters.</p>
        ) : filtered.map(v => (
          <div key={v.id} className="px-4 py-4">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 truncate">{v.property.customer.user.name ?? "—"}</p>
                <p className="text-xs text-gray-400 truncate">{v.property.address.split(",")[0]}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-medium text-gray-700">
                  {new Date(v.scheduledAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(v.scheduledAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[v.type] ?? "bg-gray-100 text-gray-600"}`}>
                {typeLabels[v.type] ?? v.type}
              </span>
              {reportBadge(v)}
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">{v.technician?.user.name ?? <span className="text-orange-500">Unassigned</span>}</p>
              <div onClick={e => e.stopPropagation()}>{reportAction(v)}</div>
            </div>
          </div>
        ))}
        <div className="px-4 py-3 text-xs text-gray-400">Showing {filtered.length} of {visits.length} visits</div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-5 py-3 font-medium text-gray-500">Date & time</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Customer</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Technician</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Type</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Visit status</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Report</th>
              <th className="text-right px-5 py-3 font-medium text-gray-500">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-400">
                  No visits match your filters.
                </td>
              </tr>
            ) : (
              filtered.map(v => (
                <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 whitespace-nowrap">
                    <p className="text-gray-900">
                      {new Date(v.scheduledAt).toLocaleDateString("en-GB", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(v.scheduledAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </td>
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-900">{v.property.customer.user.name ?? "—"}</p>
                    <p className="text-xs text-gray-400">{v.property.address}</p>
                  </td>
                  <td className="px-5 py-3 text-gray-600">
                    {v.technician?.user.name ?? (
                      <span className="text-orange-500 font-medium">Unassigned</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-col gap-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium w-fit ${typeColors[v.type] ?? "bg-gray-100 text-gray-600"}`}>
                        {typeLabels[v.type] ?? v.type}
                      </span>
                      {v.isEmergency && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium w-fit bg-red-100 text-red-700">Emergency</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[v.status]}`}>
                      {v.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {reportBadge(v)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {reportAction(v)}
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
    </>
  );
}

const selectCls = "text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500";
