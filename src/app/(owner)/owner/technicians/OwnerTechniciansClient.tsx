"use client";

import { useState } from "react";
import { Trash2, Loader2, Search } from "lucide-react";

type Technician = {
  id: string;
  userId: string;
  qualification: string | null;
  licenceNumber: string | null;
  activeVisits: number;
  user: { id: string; name: string | null; email: string | null; phone: string | null; image: string | null; createdAt: string };
};

export default function OwnerTechniciansClient({ technicians: initial }: { technicians: Technician[] }) {
  const [technicians, setTechnicians] = useState(initial);
  const [search,      setSearch]      = useState("");
  const [deletingId,  setDeletingId]  = useState<string | null>(null);

  const filtered = technicians.filter(t => {
    const q = search.toLowerCase();
    return !q || t.user.name?.toLowerCase().includes(q) || t.user.email?.toLowerCase().includes(q);
  });

  async function handleDelete(userId: string) {
    if (!confirm("Permanently delete this technician account? Their scheduled visits will become unassigned.")) return;
    setDeletingId(userId);
    const res = await fetch(`/api/accounts/${userId}`, { method: "DELETE" });
    setDeletingId(null);
    if (res.ok) setTechnicians(ts => ts.filter(t => t.userId !== userId));
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search technicians…"
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {filtered.length === 0 ? (
          <p className="text-center py-12 text-sm text-gray-400">No technicians found.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map(t => (
              <div key={t.id} className="flex items-center gap-4 px-5 py-4">
                <div className="w-9 h-9 rounded-full overflow-hidden bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-sm shrink-0">
                  {t.user.image
                    ? <img src={t.user.image} alt={t.user.name ?? ""} className="w-full h-full object-cover" />
                    : (t.user.name?.charAt(0)?.toUpperCase() ?? "T")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{t.user.name ?? "—"}</p>
                  <p className="text-xs text-gray-500 truncate">{t.user.email}</p>
                  {t.qualification && <p className="text-xs text-gray-400">{t.qualification}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-gray-500">{t.activeVisits} active visit{t.activeVisits !== 1 ? "s" : ""}</p>
                  <p className="text-xs text-gray-400">{new Date(t.user.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
                </div>
                <button
                  onClick={() => handleDelete(t.user.id)}
                  disabled={deletingId === t.user.id}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 shrink-0"
                  title="Delete technician"
                >
                  {deletingId === t.user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400">
          {filtered.length} of {technicians.length} technician{technicians.length !== 1 ? "s" : ""}
        </div>
      </div>
    </div>
  );
}
