"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";

const TIERS = ["BASIC", "STANDARD", "PLUS", "PREMIUM", "ENTERPRISE"] as const;
const PROPERTY_TYPES = ["House", "Flat", "Bungalow", "Terraced", "Semi-detached", "Detached"];
const OWNERSHIP_TYPES = [
  { value: "OWNER",  label: "Owner" },
  { value: "TENANT", label: "Tenant" },
];

export default function AddCustomerModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "", email: "", phone: "", password: "",
    subscriptionTier: "BASIC" as typeof TIERS[number],
    address: "", postcode: "", propertyType: "House", ownershipType: "OWNER", bedrooms: "",
  });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/customers", {
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
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Add customer</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Field label="Full name" required>
              <input className={inputCls} value={form.name} onChange={(e) => set("name", e.target.value)} required />
            </Field>
            <Field label="Email" required>
              <input type="email" className={inputCls} value={form.email} onChange={(e) => set("email", e.target.value)} required />
            </Field>
            <Field label="Phone">
              <input className={inputCls} value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </Field>
            <Field label="Temporary password" required>
              <input type="password" className={inputCls} value={form.password} onChange={(e) => set("password", e.target.value)} required />
            </Field>
          </div>

          <Field label="Subscription plan" required>
            <select className={inputCls} value={form.subscriptionTier} onChange={(e) => set("subscriptionTier", e.target.value)}>
              {TIERS.map((t) => <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>)}
            </select>
          </Field>

          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-2">Property</p>

          <Field label="Address" required>
            <input className={inputCls} value={form.address} onChange={(e) => set("address", e.target.value)} required placeholder="12 Example Street, London" />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Postcode" required>
              <input className={inputCls} value={form.postcode} onChange={(e) => set("postcode", e.target.value)} required placeholder="E1 1AA" />
            </Field>
            <Field label="Bedrooms">
              <input type="number" min="1" max="10" className={inputCls} value={form.bedrooms} onChange={(e) => set("bedrooms", e.target.value)} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Property type">
              <select className={inputCls} value={form.propertyType} onChange={(e) => set("propertyType", e.target.value)}>
                {PROPERTY_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Ownership">
              <select className={inputCls} value={form.ownershipType} onChange={(e) => set("ownershipType", e.target.value)}>
                {OWNERSHIP_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
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
              {loading ? "Adding…" : "Add customer"}
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
