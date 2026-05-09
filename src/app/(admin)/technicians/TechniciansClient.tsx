"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Plus, X, Loader2, AlertCircle, CheckCircle } from "lucide-react";

type Visit = { id: string; status: string; scheduledAt: Date };
type Technician = {
  id: string;
  qualification: string | null;
  licenceNumber: string | null;
  user: { id: string; name: string | null; email: string | null; phone: string | null };
  visits: Visit[];
};

function AddTechnicianModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    name: "", email: "", phone: "", password: "",
    qualification: "", licenceNumber: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/technicians", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Something went wrong"); return; }
    onCreated();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Add technician</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {([ ["Full name", "name", "text"], ["Email address", "email", "email"],
                 ["Phone number", "phone", "tel"], ["Password", "password", "password"],
               ] as const).map(([label, key, type]) => (
              <div key={key} className={key === "name" || key === "email" ? "col-span-2" : ""}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                <input
                  type={type}
                  value={form[key]}
                  onChange={set(key)}
                  required={key !== "phone"}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 pt-4 space-y-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Credentials</p>
            {([["Qualification", "qualification"], ["Licence number", "licenceNumber"]] as const).map(([label, key]) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                <input
                  type="text"
                  value={form[key]}
                  onChange={set(key)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            ))}
          </div>
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-xl">Cancel</button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 bg-brand-600 text-white text-sm font-medium rounded-xl hover:bg-brand-700 disabled:opacity-60"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Add technician
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TechniciansClient({ technicians: initial }: { technicians: Technician[] }) {
  const [technicians, setTechnicians] = useState(initial);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [added, setAdded] = useState(false);

  const now = new Date();
  const filtered = technicians.filter(t => {
    const q = search.toLowerCase();
    return (
      t.user.name?.toLowerCase().includes(q) ||
      t.user.email?.toLowerCase().includes(q) ||
      t.qualification?.toLowerCase().includes(q) ||
      t.licenceNumber?.toLowerCase().includes(q)
    );
  });

  function handleCreated() {
    setShowModal(false);
    setAdded(true);
    setTimeout(() => { window.location.reload(); }, 800);
  }

  return (
    <>
      {showModal && (
        <AddTechnicianModal onClose={() => setShowModal(false)} onCreated={handleCreated} />
      )}

      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email or licence…"
              className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white text-sm font-medium rounded-xl hover:bg-brand-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add technician
          </button>
        </div>

        {added && (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <CheckCircle className="w-4 h-4 shrink-0" /> Technician added successfully.
          </div>
        )}

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 px-6 py-12 text-center text-sm text-gray-400">
            No technicians match your search.
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Technician", "Contact", "Credentials", "Completed", "Upcoming", "Last visit"].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(t => {
                  const completed = t.visits.filter(v => v.status === "COMPLETED").length;
                  const upcoming  = t.visits.filter(v => v.status === "SCHEDULED" && new Date(v.scheduledAt) >= now).length;
                  const lastVisit = t.visits.find(v => v.status === "COMPLETED");
                  return (
                    <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <Link href={`/technicians/${t.id}`} className="flex items-center gap-3 group">
                          <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-xs shrink-0">
                            {t.user.name?.charAt(0) ?? "T"}
                          </div>
                          <span className="font-medium text-gray-900 group-hover:text-brand-600 transition-colors">
                            {t.user.name ?? "—"}
                          </span>
                        </Link>
                      </td>
                      <td className="px-5 py-4 text-gray-500">
                        <p>{t.user.email}</p>
                        {t.user.phone && <p className="text-xs text-gray-400">{t.user.phone}</p>}
                      </td>
                      <td className="px-5 py-4">
                        {t.qualification
                          ? <p className="text-gray-700 text-xs leading-snug">{t.qualification}</p>
                          : <span className="text-gray-300">—</span>}
                        {t.licenceNumber && (
                          <p className="text-xs text-gray-400 mt-0.5 font-mono">{t.licenceNumber}</p>
                        )}
                      </td>
                      <td className="px-5 py-4 font-semibold text-green-600">{completed}</td>
                      <td className="px-5 py-4 font-semibold text-blue-600">{upcoming}</td>
                      <td className="px-5 py-4 text-gray-500 text-xs">
                        {lastVisit
                          ? new Date(lastVisit.scheduledAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                          : <span className="text-gray-300">No visits</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
