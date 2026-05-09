"use client";

import { useState } from "react";
import { Plus, Search } from "lucide-react";
import AddCustomerModal from "@/components/admin/AddCustomerModal";

const tierColors: Record<string, string> = {
  BASIC:      "bg-gray-100 text-gray-700",
  STANDARD:   "bg-blue-100 text-blue-700",
  PLUS:       "bg-purple-100 text-purple-700",
  PREMIUM:    "bg-amber-100 text-amber-700",
  ENTERPRISE: "bg-emerald-100 text-emerald-700",
};

const statusColors: Record<string, string> = {
  ACTIVE:    "bg-green-100 text-green-700",
  PAUSED:    "bg-yellow-100 text-yellow-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const TIER_PRICES: Record<string, number> = {
  BASIC: 15, STANDARD: 22, PLUS: 27, PREMIUM: 50, ENTERPRISE: 75,
};

type Customer = {
  id: string;
  subscriptionTier: string;
  subscriptionStatus: string;
  visitsPerYear: number;
  discountPercent: number;
  createdAt: Date;
  user: { name: string | null; email: string | null; phone: string | null; createdAt: Date };
  properties: {
    id: string;
    visits: { scheduledAt: Date; completedAt: Date | null; status: string }[];
  }[];
};

export default function CustomersClient({ customers }: { customers: Customer[] }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      c.user.name?.toLowerCase().includes(q) ||
      c.user.email?.toLowerCase().includes(q) ||
      c.user.phone?.toLowerCase().includes(q);
    const matchesTier = tierFilter === "ALL" || c.subscriptionTier === tierFilter;
    const matchesStatus = statusFilter === "ALL" || c.subscriptionStatus === statusFilter;
    return matchesSearch && matchesTier && matchesStatus;
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
            placeholder="Search by name, email or phone…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="ALL">All tiers</option>
          {["BASIC", "STANDARD", "PLUS", "PREMIUM", "ENTERPRISE"].map((t) => (
            <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="ALL">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="PAUSED">Paused</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 bg-brand-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-brand-700 ml-auto"
        >
          <Plus className="w-4 h-4" />
          Add customer
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-5 py-3 font-medium text-gray-500">Name</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Contact</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Plan</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Status</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Discount</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Visits/yr</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Properties</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Last visit</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Member since</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-gray-400">
                  No customers match your filters.
                </td>
              </tr>
            ) : (
              filtered.map((c) => {
                const lastVisit = c.properties
                  .flatMap((p) => p.visits)
                  .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())[0];

                return (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-900">{c.user.name ?? "—"}</td>
                    <td className="px-5 py-3">
                      <p className="text-gray-700">{c.user.email}</p>
                      {c.user.phone && <p className="text-gray-400 text-xs">{c.user.phone}</p>}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tierColors[c.subscriptionTier]}`}>
                        {c.subscriptionTier.charAt(0) + c.subscriptionTier.slice(1).toLowerCase()} — £{TIER_PRICES[c.subscriptionTier]}/mo
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[c.subscriptionStatus]}`}>
                        {c.subscriptionStatus.charAt(0) + c.subscriptionStatus.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{c.discountPercent}%</td>
                    <td className="px-5 py-3 text-gray-600">{c.visitsPerYear}</td>
                    <td className="px-5 py-3 text-gray-600">{c.properties.length}</td>
                    <td className="px-5 py-3 text-gray-500 text-xs">
                      {lastVisit
                        ? new Date(lastVisit.scheduledAt).toLocaleDateString("en-GB", {
                            day: "numeric", month: "short", year: "numeric",
                          })
                        : "No visits yet"}
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs">
                      {new Date(c.user.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400">
          Showing {filtered.length} of {customers.length} customers
        </div>
      </div>

      {open && <AddCustomerModal onClose={() => setOpen(false)} />}
    </>
  );
}
