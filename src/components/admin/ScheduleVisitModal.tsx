"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";

type Property = { id: string; address: string; postcode: string; customer: { user: { name: string | null } } };
type Technician = { id: string; user: { name: string | null } };

const VISIT_TYPES = [
  { value: "ROUTINE_BOTH",       label: "Routine — Plumbing & Electrical" },
  { value: "ROUTINE_PLUMBING",   label: "Routine — Plumbing only" },
  { value: "ROUTINE_ELECTRICAL", label: "Routine — Electrical only" },
  { value: "BOILER_SERVICE",     label: "Boiler service" },
  { value: "EMERGENCY",          label: "Emergency" },
];

export default function ScheduleVisitModal({
  properties,
  technicians,
  onClose,
}: {
  properties: Property[];
  technicians: Technician[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    propertyId: properties[0]?.id ?? "",
    technicianId: "",
    scheduledAt: "",
    type: "ROUTINE_BOTH",
    isEmergency: false,
  });

  function set(field: string, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/visits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Something went wrong");
      return;
    }

    router.refresh();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Schedule visit</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>
          )}

          <Field label="Property" required>
            <select className={inputCls} value={form.propertyId} onChange={(e) => set("propertyId", e.target.value)} required>
              {properties.length === 0 && <option value="">No properties yet</option>}
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.address}, {p.postcode} ({p.customer.user.name ?? "Unknown"})
                </option>
              ))}
            </select>
          </Field>

          <Field label="Visit type" required>
            <select className={inputCls} value={form.type} onChange={(e) => set("type", e.target.value)}>
              {VISIT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>

          <Field label="Date & time" required>
            <input
              type="datetime-local"
              className={inputCls}
              value={form.scheduledAt}
              onChange={(e) => set("scheduledAt", e.target.value)}
              required
            />
          </Field>

          <Field label="Assign technician">
            <select className={inputCls} value={form.technicianId} onChange={(e) => set("technicianId", e.target.value)}>
              <option value="">Unassigned</option>
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>{t.user.name ?? "Unnamed technician"}</option>
              ))}
            </select>
          </Field>

          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isEmergency}
              onChange={(e) => set("isEmergency", e.target.checked)}
              className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            Emergency call-out
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || properties.length === 0}
              className="px-5 py-2 bg-brand-600 text-white text-sm font-semibold rounded-lg hover:bg-brand-700 disabled:opacity-50"
            >
              {loading ? "Scheduling…" : "Schedule visit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
