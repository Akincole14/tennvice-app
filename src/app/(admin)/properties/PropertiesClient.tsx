"use client";

import { useState } from "react";
import { Search, FileText } from "lucide-react";

const tierColors: Record<string, string> = {
  BASIC:      "bg-gray-100 text-gray-700",
  STANDARD:   "bg-blue-100 text-blue-700",
  PLUS:       "bg-purple-100 text-purple-700",
  PREMIUM:    "bg-amber-100 text-amber-700",
  ENTERPRISE: "bg-emerald-100 text-emerald-700",
};

type Visit = { id: string; status: string; scheduledAt: Date; isEmergency: boolean };
type Property = {
  id: string;
  address: string;
  postcode: string;
  propertyType: string;
  ownershipType: string;
  bedrooms: number | null;
  notes: string | null;
  customer: {
    subscriptionTier: string;
    user: { name: string | null };
  };
  visits: Visit[];
};

export default function PropertiesClient({ properties }: { properties: Property[] }) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const propertyTypes = Array.from(new Set(properties.map((p) => p.propertyType))).sort();

  const filtered = properties.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      p.address.toLowerCase().includes(q) ||
      p.postcode.toLowerCase().includes(q) ||
      p.customer.user.name?.toLowerCase().includes(q);
    const matchesType = typeFilter === "ALL" || p.propertyType === typeFilter;
    return matchesSearch && matchesType;
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
            placeholder="Search by address, postcode or customer…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="ALL">All types</option>
          {propertyTypes.map((t) => <option key={t}>{t}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-5 py-3 font-medium text-gray-500">Address</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Type</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Ownership</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Beds</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Customer</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Plan</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Visits</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Next visit</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Notes</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-gray-400">
                  No properties match your search.
                </td>
              </tr>
            ) : (
              filtered.map((p) => {
                const now = new Date();
                const completed = p.visits.filter((v) => v.status === "COMPLETED").length;
                const scheduled = p.visits.filter((v) => v.status === "SCHEDULED").length;
                const cancelled = p.visits.filter((v) => v.status === "CANCELLED").length;
                const nextVisit = p.visits.find(
                  (v) => v.status === "SCHEDULED" && new Date(v.scheduledAt) >= now
                );

                return (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">{p.address}</p>
                      <p className="text-gray-400 text-xs">{p.postcode}</p>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{p.propertyType}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.ownershipType === "TENANT" ? "bg-blue-50 text-blue-700" : "bg-green-50 text-green-700"}`}>
                        {p.ownershipType === "TENANT" ? "Tenant" : "Owner"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{p.bedrooms ?? "—"}</td>
                    <td className="px-5 py-3 text-gray-700">{p.customer.user.name ?? "—"}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tierColors[p.customer.subscriptionTier]}`}>
                        {p.customer.subscriptionTier.charAt(0) + p.customer.subscriptionTier.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-gray-700 font-medium">{p.visits.length}</span>
                        {completed > 0 && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-green-50 text-green-700">{completed} done</span>
                        )}
                        {scheduled > 0 && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">{scheduled} scheduled</span>
                        )}
                        {cancelled > 0 && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-red-50 text-red-600">{cancelled} cancelled</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs">
                      {nextVisit
                        ? new Date(nextVisit.scheduledAt).toLocaleDateString("en-GB", {
                            day: "numeric", month: "short", year: "numeric",
                          })
                        : <span className="text-gray-400">None scheduled</span>}
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs max-w-48 truncate">
                      {p.notes ?? <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-3">
                      <a
                        href={`/portal/report/${p.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium whitespace-nowrap"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Service report
                      </a>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400">
          Showing {filtered.length} of {properties.length} properties
        </div>
      </div>
    </>
  );
}
