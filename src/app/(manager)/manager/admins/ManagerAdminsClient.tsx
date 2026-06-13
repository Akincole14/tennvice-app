"use client";

import { useState } from "react";
import { ShieldCheck, Shield, Trash2, Loader2 } from "lucide-react";

type Admin = {
  id: string;
  name: string | null;
  email: string | null;
  adminRole: string | null;
  image: string | null;
  createdAt: string;
};

export default function ManagerAdminsClient({ admins: initial }: { admins: Admin[] }) {
  const [admins,     setAdmins]     = useState(initial);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string, name: string | null) {
    if (!confirm(`Permanently delete admin account for ${name ?? "this user"}?`)) return;
    setDeletingId(id);
    const res = await fetch(`/api/accounts/${id}`, { method: "DELETE" });
    setDeletingId(null);
    if (res.ok) setAdmins(a => a.filter(x => x.id !== id));
  }

  if (admins.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-12">No admin accounts found.</p>;
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="divide-y divide-gray-100">
        {admins.map(a => {
          const isSenior = !a.adminRole || a.adminRole === "SENIOR";
          return (
            <div key={a.id} className="flex items-center gap-4 px-6 py-4">
              <div className="w-9 h-9 rounded-full overflow-hidden bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-sm shrink-0">
                {a.image
                  ? <img src={a.image} alt={a.name ?? ""} className="w-full h-full object-cover" />
                  : (a.name?.charAt(0)?.toUpperCase() ?? "A")}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{a.name ?? "—"}</p>
                <p className="text-xs text-gray-500 truncate">{a.email}</p>
              </div>
              <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${
                isSenior ? "bg-brand-50 text-brand-700" : "bg-gray-100 text-gray-600"
              }`}>
                {isSenior ? <ShieldCheck className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                {isSenior ? "Senior Admin" : "Admin"}
              </span>
              <button
                onClick={() => handleDelete(a.id, a.name)}
                disabled={deletingId === a.id}
                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 shrink-0"
                title="Delete admin"
              >
                {deletingId === a.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
