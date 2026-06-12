"use client";

import { useState } from "react";
import { Plus, X, Loader2, AlertCircle, CheckCircle, ShieldCheck, Shield } from "lucide-react";

type AdminUser = {
  id: string;
  name: string | null;
  email: string | null;
  adminRole: string | null;
  createdAt: string;
};

function SetUpAdminModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", adminRole: "STANDARD" });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res  = await fetch("/api/admins", {
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Set up Admin</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={submit} className="px-6 py-5 space-y-4">

          {/* Role selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Admin role</label>
            <div className="grid grid-cols-2 gap-3">
              {([
                { value: "SENIOR", icon: ShieldCheck, title: "Senior Admin", desc: "Full access — all data, all permissions" },
                { value: "STANDARD", icon: Shield, title: "Admin", desc: "No revenue data, cannot add or edit technicians or properties" },
              ] as const).map(({ value, icon: Icon, title, desc }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, adminRole: value }))}
                  className={`text-left p-4 rounded-xl border-2 transition-colors ${
                    form.adminRole === value
                      ? "border-brand-500 bg-brand-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Icon className={`w-5 h-5 mb-2 ${form.adminRole === value ? "text-brand-600" : "text-gray-400"}`} />
                  <p className={`text-sm font-semibold ${form.adminRole === value ? "text-brand-700" : "text-gray-800"}`}>{title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-snug">{desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Personal details */}
          <div className="border-t border-gray-100 pt-4 space-y-3">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide">Details</label>
            {([
              ["Full name",     "name",     "text",     true],
              ["Email address", "email",    "email",    true],
              ["Password",      "password", "password", true],
            ] as const).map(([label, key, type, required]) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {label}<span className="text-red-400 ml-0.5">*</span>
                </label>
                <input
                  type={type}
                  value={form[key]}
                  onChange={set(key)}
                  required={required}
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
              Create admin
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminsClient({ admins: initial }: { admins: AdminUser[] }) {
  const [admins,    setAdmins]    = useState(initial);
  const [showModal, setShowModal] = useState(false);
  const [added,     setAdded]     = useState(false);

  function handleCreated() {
    setShowModal(false);
    setAdded(true);
    setTimeout(() => window.location.reload(), 800);
  }

  return (
    <>
      {showModal && <SetUpAdminModal onClose={() => setShowModal(false)} onCreated={handleCreated} />}

      <div className="space-y-4">
        {added && (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <CheckCircle className="w-4 h-4 shrink-0" /> Admin account created successfully.
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">{admins.length} admin{admins.length !== 1 ? "s" : ""}</span>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-xl hover:bg-brand-700 transition-colors"
            >
              <Plus className="w-4 h-4" /> Set up Admin
            </button>
          </div>

          {admins.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-gray-400">No admin accounts yet.</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {admins.map(a => {
                const isSenior = !a.adminRole || a.adminRole === "SENIOR";
                return (
                  <div key={a.id} className="flex items-center gap-4 px-6 py-4">
                    <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-sm shrink-0">
                      {a.name?.charAt(0)?.toUpperCase() ?? "A"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{a.name ?? "—"}</p>
                      <p className="text-xs text-gray-500 truncate">{a.email}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${
                      isSenior ? "bg-brand-50 text-brand-700" : "bg-gray-100 text-gray-600"
                    }`}>
                      {isSenior ? <ShieldCheck className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                      {isSenior ? "Senior Admin" : "Admin"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
