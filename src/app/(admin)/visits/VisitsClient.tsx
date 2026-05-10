"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, Search, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  property: { address: string; customer: { user: { name: string | null } } };
  technician: { id: string; user: { name: string | null } } | null;
  report: { signedByTechnician: boolean; followUpRequired: boolean } | null;
};

type Property = { id: string; address: string; postcode: string; customer: { user: { name: string | null } } };
type Technician = { id: string; user: { name: string | null } };

// ─── Inline assign widget ────────────────────────────────────────────────────

function InlineAssign({ visitId, technicians, onAssigned }: {
  visitId: string;
  technicians: Technician[];
  onAssigned: (visitId: string, techId: string) => void;
}) {
  const [techId, setTechId] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!techId) return;
    setSaving(true);
    await fetch(`/api/visits/${visitId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ technicianId: techId }),
    });
    setSaving(false);
    onAssigned(visitId, techId);
  }

  return (
    <div className="flex items-center gap-1.5">
      <select
        value={techId}
        onChange={e => setTechId(e.target.value)}
        className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand-500 text-gray-600"
      >
        <option value="">Assign…</option>
        {technicians.map(t => (
          <option key={t.id} value={t.id}>{t.user.name ?? "Unnamed"}</option>
        ))}
      </select>
      {techId && (
        <button
          onClick={save}
          disabled={saving}
          className="text-xs font-medium text-brand-600 hover:text-brand-800 disabled:opacity-40"
        >
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
        </button>
      )}
    </div>
  );
}

// ─── Main client component ───────────────────────────────────────────────────

export default function VisitsClient({
  visits: initial,
  properties,
  technicians,
}: {
  visits: Visit[];
  properties: Property[];
  technicians: Technician[];
}) {
  const router = useRouter();
  const [visits, setVisits] = useState(initial);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [emergencyOnly, setEmergencyOnly] = useState(false);
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [techFilter, setTechFilter] = useState("ALL");
  const [period, setPeriod] = useState("ALL");

  // Sync when server refreshes props (e.g. after router.refresh())
  useEffect(() => setVisits(initial), [initial]);

  // Stats computed over all visits (unfiltered)
  const stats = useMemo(() => ({
    total:      visits.length,
    upcoming:   visits.filter(v => v.status === "SCHEDULED").length,
    inProgress: visits.filter(v => v.status === "IN_PROGRESS").length,
    completed:  visits.filter(v => v.status === "COMPLETED").length,
    cancelled:  visits.filter(v => v.status === "CANCELLED").length,
    emergency:  visits.filter(v => v.isEmergency).length,
  }), [visits]);

  // Date-period helpers (computed once per render — stable enough for filtering)
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const todayEnd   = todayStart + 86_400_000;
  const daysFromMon = (now.getDay() + 6) % 7;
  const weekStart  = todayStart - daysFromMon * 86_400_000;
  const weekEnd    = weekStart + 7 * 86_400_000;
  const nextWeekStart = weekEnd;
  const nextWeekEnd   = nextWeekStart + 7 * 86_400_000;
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();

  function inPeriod(d: Date): boolean {
    const t = new Date(d).getTime();
    if (period === "TODAY")      return t >= todayStart && t < todayEnd;
    if (period === "THIS_WEEK")  return t >= weekStart  && t < weekEnd;
    if (period === "NEXT_WEEK")  return t >= nextWeekStart && t < nextWeekEnd;
    if (period === "THIS_MONTH") return t >= monthStart && t < monthEnd;
    return true;
  }

  const filtered = useMemo(() => visits.filter(v => {
    const q = search.toLowerCase();
    if (q && !v.property.customer.user.name?.toLowerCase().includes(q) && !v.property.address.toLowerCase().includes(q)) return false;
    if (statusFilter !== "ALL" && v.status !== statusFilter) return false;
    if (emergencyOnly && !v.isEmergency) return false;
    if (typeFilter !== "ALL" && v.type !== typeFilter) return false;
    if (techFilter === "UNASSIGNED" && v.technician) return false;
    if (techFilter !== "ALL" && techFilter !== "UNASSIGNED" && v.technician?.id !== techFilter) return false;
    if (!inPeriod(v.scheduledAt)) return false;
    return true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [visits, search, statusFilter, emergencyOnly, typeFilter, techFilter, period]);

  function handleTileClick(filter: string) {
    if (filter === "EMERGENCY") {
      setEmergencyOnly(e => !e);
    } else {
      setStatusFilter(f => f === filter ? "ALL" : filter);
      setEmergencyOnly(false);
    }
  }

  function isTileActive(filter: string) {
    if (filter === "EMERGENCY") return emergencyOnly;
    if (filter === "ALL")       return statusFilter === "ALL" && !emergencyOnly;
    return statusFilter === filter;
  }

  function handleAssign(visitId: string, techId: string) {
    const tech = technicians.find(t => t.id === techId);
    setVisits(vs => vs.map(v =>
      v.id === visitId
        ? { ...v, technician: tech ? { id: tech.id, user: { name: tech.user.name } } : null }
        : v,
    ));
    router.refresh();
  }

  const tiles = [
    { filter: "ALL",         label: "Total",       value: stats.total,      color: "text-gray-900"   },
    { filter: "SCHEDULED",   label: "Upcoming",    value: stats.upcoming,   color: "text-blue-600"   },
    { filter: "IN_PROGRESS", label: "In progress", value: stats.inProgress, color: "text-yellow-600" },
    { filter: "COMPLETED",   label: "Completed",   value: stats.completed,  color: "text-green-600"  },
    { filter: "CANCELLED",   label: "Cancelled",   value: stats.cancelled,  color: "text-red-500"    },
    { filter: "EMERGENCY",   label: "Emergency",   value: stats.emergency,  color: "text-rose-600"   },
  ];

  return (
    <>
      {/* Stat tiles — clickable filters */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 md:gap-4">
        {tiles.map(({ filter, label, value, color }) => (
          <button
            key={filter}
            onClick={() => handleTileClick(filter)}
            className={`bg-white rounded-2xl border px-3 py-3 md:px-5 md:py-4 text-left transition-all ${
              isTileActive(filter)
                ? "border-brand-400 ring-2 ring-brand-100"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <p className={`text-lg md:text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-[10px] md:text-xs text-gray-500 mt-0.5 leading-tight">{label}</p>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="space-y-2 md:space-y-0 md:flex md:flex-wrap md:items-center md:gap-3">
        {/* Row 1: search + schedule button */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search visits…"
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-1.5 bg-brand-600 text-white text-sm font-semibold px-3 py-2 rounded-lg hover:bg-brand-700 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule</span>
          </button>
        </div>
        {/* Row 2: period filter (always), type + tech filters (desktop only) */}
        <div className="flex gap-2 md:contents">
          <select value={period} onChange={e => setPeriod(e.target.value)} className={`flex-1 md:flex-none ${selectCls}`}>
            <option value="ALL">All time</option>
            <option value="TODAY">Today</option>
            <option value="THIS_WEEK">This week</option>
            <option value="NEXT_WEEK">Next week</option>
            <option value="THIS_MONTH">This month</option>
          </select>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className={`hidden md:block ${selectCls}`}>
            <option value="ALL">All types</option>
            {Object.entries(typeLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select value={techFilter} onChange={e => setTechFilter(e.target.value)} className={`hidden md:block ${selectCls}`}>
            <option value="ALL">All technicians</option>
            <option value="UNASSIGNED">Unassigned</option>
            {technicians.map(t => (
              <option key={t.id} value={t.id}>{t.user.name ?? "Unnamed"}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
        {filtered.length === 0 ? (
          <p className="text-center py-12 text-sm text-gray-400">No visits match your filters.</p>
        ) : filtered.map(v => (
          <div
            key={v.id}
            onClick={() => router.push(`/visits/${v.id}`)}
            className="px-4 py-4 cursor-pointer active:bg-gray-50"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 truncate">{v.property.customer.user.name ?? "—"}</p>
                <p className="text-xs text-gray-400 truncate">{v.property.address}</p>
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
              {v.isEmergency && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Emergency</span>
              )}
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[v.status]}`}>
                {v.status.replace("_", " ")}
              </span>
              {v.report && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${v.report.signedByTechnician ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                  {v.report.signedByTechnician ? "Signed" : "Unsigned"}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between" onClick={e => e.stopPropagation()}>
              <div className="text-xs text-gray-500">
                {v.technician ? (
                  <span>{v.technician.user.name}</span>
                ) : (
                  <InlineAssign visitId={v.id} technicians={technicians} onAssigned={handleAssign} />
                )}
              </div>
              {!v.report && (v.status === "COMPLETED" || v.status === "IN_PROGRESS") && (
                <Link href={`/visits/${v.id}/report`} className="text-brand-600 text-xs font-medium hover:underline">
                  Add report
                </Link>
              )}
            </div>
          </div>
        ))}
        <div className="px-4 py-3 text-xs text-gray-400">
          Showing {filtered.length} of {visits.length} visits
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-2xl border border-gray-200 overflow-hidden">
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
              filtered.map(v => (
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
                  <td className="px-5 py-3" onClick={e => e.stopPropagation()}>
                    {v.technician ? (
                      <span className="text-gray-700">{v.technician.user.name}</span>
                    ) : (
                      <InlineAssign visitId={v.id} technicians={technicians} onAssigned={handleAssign} />
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[v.status]}`}>
                      {v.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-5 py-3" onClick={e => e.stopPropagation()}>
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
                      <Link href={`/visits/${v.id}/report`} className="text-brand-600 text-xs font-medium hover:underline">
                        Add report
                      </Link>
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

const selectCls = "text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500";
