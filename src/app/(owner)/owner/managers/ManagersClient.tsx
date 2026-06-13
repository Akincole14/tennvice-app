"use client";

import { useState } from "react";
import { Plus, X, Loader2, AlertCircle, CheckCircle, Eye, EyeOff, Trash2 } from "lucide-react";

type Manager = {
  id: string;
  name: string | null;
  email: string | null;
  createdAt: string;
};

function SetUpManagerModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form,        setForm]        = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res  = await fetch("/api/managers", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(form),
    });
    const data = await res.json();

    if (!res.ok) {
      setLoading(false);
      setError(data.error ?? "Something went wrong");
      return;
    }

    setLoading(false);
    onCreated();
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Set up Manager</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={submit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Full name<span className="text-red-400 ml-0.5">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={set("name")}
              required
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Email address<span className="text-red-400 ml-0.5">*</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={set("email")}
              required
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Password<span className="text-red-400 ml-0.5">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={set("password")}
                required
                className="w-full border border-gray-200 rounded-xl px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-xl">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 bg-brand-600 text-white text-sm font-medium rounded-xl hover:bg-brand-700 disabled:opacity-60"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Create manager
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ManagersClient({ managers: initial }: { managers: Manager[] }) {
  const [managers,   setManagers]   = useState(initial);
  const [showModal,  setShowModal]  = useState(false);
  const [added,      setAdded]      = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function handleCreated() {
    setShowModal(false);
    setAdded(true);
    setTimeout(() => window.location.reload(), 800);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this manager account?")) return;
    setDeletingId(id);
    const res = await fetch(`/api/accounts/${id}`, { method: "DELETE" });
    setDeletingId(null);
    if (res.ok) {
      setManagers(ms => ms.filter(m => m.id !== id));
    }
  }

  return (
    <>
      {showModal && <SetUpManagerModal onClose={() => setShowModal(false)} onCreated={handleCreated} />}

      <div className="space-y-4">
        {added && (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <CheckCircle className="w-4 h-4 shrink-0" /> Manager account created successfully.
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">{managers.length} manager{managers.length !== 1 ? "s" : ""}</span>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-xl hover:bg-brand-700 transition-colors"
            >
              <Plus className="w-4 h-4" /> Set up Manager
            </button>
          </div>

          {managers.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-gray-400">No manager accounts yet.</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {managers.map(m => (
                <div key={m.id} className="flex items-center gap-4 px-6 py-4">
                  <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm shrink-0">
                    {m.name?.charAt(0)?.toUpperCase() ?? "M"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{m.name ?? "—"}</p>
                    <p className="text-xs text-gray-500 truncate">{m.email}</p>
                  </div>
                  <p className="text-xs text-gray-400 hidden sm:block">
                    {new Date(m.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                  <button
                    onClick={() => handleDelete(m.id)}
                    disabled={deletingId === m.id}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Delete manager"
                  >
                    {deletingId === m.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
