"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";

const VISIT_TYPES = [
  { value: "ROUTINE_BOTH",       label: "Routine — Plumbing & Electrical" },
  { value: "ROUTINE_PLUMBING",   label: "Routine — Plumbing only" },
  { value: "ROUTINE_ELECTRICAL", label: "Routine — Electrical only" },
  { value: "BOILER_SERVICE",     label: "Boiler service" },
  { value: "EMERGENCY",          label: "Emergency" },
];

type Technician = { id: string; user: { name: string | null } };

function toDatetimeLocal(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  const dt = new Date(d);
  return `${dt.getFullYear()}-${p(dt.getMonth() + 1)}-${p(dt.getDate())}T${p(dt.getHours())}:${p(dt.getMinutes())}`;
}

export default function EditVisitModal({
  visitId,
  initialType,
  initialScheduledAt,
  initialTechnicianId,
  technicians,
  onClose,
}: {
  visitId: string;
  initialType: string;
  initialScheduledAt: Date;
  initialTechnicianId: string | null;
  technicians: Technician[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    type:         initialType,
    scheduledAt:  toDatetimeLocal(new Date(initialScheduledAt)),
    technicianId: initialTechnicianId ?? "",
  });

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch(`/api/visits/${visitId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type:         form.type,
        scheduledAt:  form.scheduledAt,
        technicianId: form.technicianId || null,
      }),
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to update visit");
      return;
    }

    router.refresh();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Edit visit</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Visit type <span className="text-red-500">*</span>
            </label>
            <select className={inputCls} value={form.type} onChange={e => set("type", e.target.value)}>
              {VISIT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date & time <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              className={inputCls}
              value={form.scheduledAt}
              onChange={e => set("scheduledAt", e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assigned technician</label>
            <select className={inputCls} value={form.technicianId} onChange={e => set("technicianId", e.target.value)}>
              <option value="">Unassigned</option>
              {technicians.map(t => (
                <option key={t.id} value={t.id}>{t.user.name ?? "Unnamed"}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-brand-600 text-white text-sm font-semibold rounded-lg hover:bg-brand-700 disabled:opacity-50"
            >
              {loading ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500";
