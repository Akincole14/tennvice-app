"use client";

import { useState } from "react";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import AddCustomerModal from "@/components/admin/AddCustomerModal";
import { TIER_LABELS } from "@/lib/utils";

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
  PENDING:   "bg-blue-100 text-blue-700",
};

const TIER_PRICES: Record<string, number> = {
  BASIC: 19, STANDARD: 26, PLUS: 35, PREMIUM: 40, ENTERPRISE: 0,
};

function effectiveDiscount(percent: number, subscribedAt: Date): number {
  const months = (Date.now() - new Date(subscribedAt).getTime()) / (1000 * 60 * 60 * 24 * 30.44);
  return months <= 6 ? Math.min(percent, 20) : 0;
}

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

export default function CustomersClient({ customers, isSenior }: { customers: Customer[]; isSenior: boolean }) {
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
      <div className="space-y-2 md:space-y-0 md:flex md:flex-wrap md:items-center md:gap-3">
        {/* Row 1: search + add */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customers…"
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-1.5 bg-brand-600 text-white text-sm font-semibold px-3 py-2 rounded-lg hover:bg-brand-700 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add</span>
          </button>
        </div>
        {/* Row 2: filters */}
        <div className="flex gap-2 md:contents">
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="flex-1 md:flex-none text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="ALL">All tiers</option>
            {["BASIC", "STANDARD", "PLUS", "PREMIUM", "ENTERPRISE"].map((t) => (
              <option key={t} value={t}>{TIER_LABELS[t] ?? t}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 md:flex-none text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PAUSED">Paused</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="PENDING">Pending quote</option>
          </select>
        </div>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
        {filtered.length === 0 ? (
          <p className="text-center py-12 text-sm text-gray-400">No customers match your filters.</p>
        ) : filtered.map((c) => {
          const lastVisit = c.properties
            .flatMap((p) => p.visits)
            .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())[0];
          return (
            <Link key={c.id} href={`/customers/${c.id}`} className="block px-4 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0">
                  <p className="font-semibold text-brand-600 truncate">{c.user.name ?? "—"}</p>
                  <p className="text-sm text-gray-500 truncate">{c.user.email}</p>
                  {c.user.phone && <p className="text-xs text-gray-400">{c.user.phone}</p>}
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tierColors[c.subscriptionTier]}`}>
                    {TIER_LABELS[c.subscriptionTier] ?? c.subscriptionTier} — £{TIER_PRICES[c.subscriptionTier]}/mo
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[c.subscriptionStatus]}`}>
                    {c.subscriptionStatus.charAt(0) + c.subscriptionStatus.slice(1).toLowerCase()}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                <span>{c.properties.length} propert{c.properties.length === 1 ? "y" : "ies"}</span>
                <span className="ml-auto">
                  Last visit: {lastVisit
                    ? new Date(lastVisit.scheduledAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
                    : "none"}
                </span>
              </div>
            </Link>
          );
        })}
        <div className="px-4 py-3 text-xs text-gray-400">
          Showing {filtered.length} of {customers.length} customers
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
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
                    <td className="px-5 py-3 font-medium">
                      <Link href={`/customers/${c.id}`} className="text-brand-600 hover:underline">
                        {c.user.name ?? "—"}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-gray-700">{c.user.email}</p>
                      {c.user.phone && <p className="text-gray-400 text-xs">{c.user.phone}</p>}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tierColors[c.subscriptionTier]}`}>
                        {TIER_LABELS[c.subscriptionTier] ?? c.subscriptionTier} — £{TIER_PRICES[c.subscriptionTier]}/mo
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[c.subscriptionStatus]}`}>
                        {c.subscriptionStatus.charAt(0) + c.subscriptionStatus.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {(() => {
                        const eff = effectiveDiscount(c.discountPercent, c.createdAt);
                        return eff > 0
                          ? <span>{eff}%</span>
                          : <span className="text-gray-400">0% <span className="text-xs">(expired)</span></span>;
                      })()}
                    </td>
                    <td className="px-5 py-3 text-gray-600">{c.visitsPerYear}</td>
                    <td className="px-5 py-3 text-gray-600">{c.properties.length}</td>
                    <td className="px-5 py-3 text-gray-500 text-xs">
                      {lastVisit
                        ? new Date(lastVisit.scheduledAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                        : "No visits yet"}
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs">
                      {new Date(c.user.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        </div>
        <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400">
          Showing {filtered.length} of {customers.length} customers
        </div>
      </div>

      {open && <AddCustomerModal onClose={() => setOpen(false)} />}
    </>
  );
}
