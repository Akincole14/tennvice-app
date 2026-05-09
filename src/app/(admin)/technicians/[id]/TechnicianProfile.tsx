"use client";

import { useRef, useState } from "react";
import { Pencil, X, Loader2, CheckCircle, AlertCircle, Wrench, Camera } from "lucide-react";
import { useRouter } from "next/navigation";

type Technician = {
  id: string;
  qualification: string | null;
  licenceNumber: string | null;
  user: { name: string | null; email: string | null; phone: string | null; image: string | null };
};

function Field({
  label, type = "text", value, onChange,
}: {
  label: string; type?: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
    </div>
  );
}

export default function TechnicianProfile({ technician }: { technician: Technician }) {
  const router  = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [editing, setEditing] = useState(false);
  const [photo,   setPhoto]   = useState(technician.user.image);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError,     setPhotoError]     = useState<string | null>(null);

  const [name,          setName]          = useState(technician.user.name ?? "");
  const [email,         setEmail]         = useState(technician.user.email ?? "");
  const [phone,         setPhone]         = useState(technician.user.phone ?? "");
  const [qualification, setQualification] = useState(technician.qualification ?? "");
  const [licenceNumber, setLicenceNumber] = useState(technician.licenceNumber ?? "");
  const [newPassword,   setNewPassword]   = useState("");

  const [loading, setLoading] = useState(false);
  const [status,  setStatus]  = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoUploading(true);
    setPhotoError(null);
    const fd = new FormData();
    fd.append("photo", file);
    const res  = await fetch(`/api/technicians/${technician.id}/photo`, { method: "POST", body: fd });
    const data = await res.json();
    setPhotoUploading(false);
    if (!res.ok) { setPhotoError(data.error ?? "Upload failed"); return; }
    setPhoto(data.imageUrl);
    router.refresh();
    e.target.value = "";
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    const res = await fetch(`/api/technicians/${technician.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone, qualification, licenceNumber, newPassword: newPassword || undefined }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setStatus({ type: "error", text: data.error ?? "Something went wrong" }); return; }
    setStatus({ type: "success", text: "Details updated." });
    setEditing(false);
    setNewPassword("");
    router.refresh();
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-4">
          {/* Avatar with upload overlay */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={photoUploading}
              className="relative group w-16 h-16 rounded-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
              title="Change photo"
            >
              {photo ? (
                <img src={photo} alt={name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-2xl">
                  {name.charAt(0) || "T"}
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {photoUploading
                  ? <Loader2 className="w-5 h-5 text-white animate-spin" />
                  : <Camera className="w-5 h-5 text-white" />}
              </div>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handlePhotoChange}
              disabled={photoUploading}
            />
          </div>

          <div>
            <h1 className="text-xl font-bold text-gray-900">{name || "—"}</h1>
            <p className="text-sm text-gray-500">{email}</p>
            {photoError && <p className="text-xs text-red-600 mt-0.5">{photoError}</p>}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={photoUploading}
              className="text-xs text-brand-600 hover:text-brand-800 mt-1 disabled:opacity-40"
            >
              {photoUploading ? "Uploading…" : "Change photo"}
            </button>
          </div>
        </div>

        <button
          onClick={() => { setEditing(e => !e); setStatus(null); }}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 border border-gray-200 px-3 py-1.5 rounded-xl transition-colors"
        >
          {editing ? <><X className="w-3.5 h-3.5" /> Cancel</> : <><Pencil className="w-3.5 h-3.5" /> Edit</>}
        </button>
      </div>

      {editing ? (
        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Full name"    value={name}        onChange={setName} />
            <Field label="Email"        type="email"  value={email}       onChange={setEmail} />
            <Field label="Phone"        type="tel"    value={phone}       onChange={setPhone} />
            <Field label="New password" type="password" value={newPassword} onChange={setNewPassword} />
          </div>
          <div className="border-t border-gray-100 pt-4 grid grid-cols-2 gap-3">
            <Field label="Qualification"  value={qualification} onChange={setQualification} />
            <Field label="Licence number" value={licenceNumber} onChange={setLicenceNumber} />
          </div>
          {status && (
            <div className={`flex items-center gap-2 text-sm rounded-xl px-4 py-3 ${status.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
              {status.type === "success" ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              {status.text}
            </div>
          )}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white text-sm font-medium rounded-xl hover:bg-brand-700 disabled:opacity-60"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Save changes
            </button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-2 gap-4 text-sm">
          {[
            ["Phone",         technician.user.phone],
            ["Qualification", technician.qualification],
            ["Licence",       technician.licenceNumber],
          ].map(([label, value]) => (
            <div key={label as string}>
              <p className="text-xs text-gray-400 mb-0.5">{label}</p>
              <p className="font-medium text-gray-800">{value ?? <span className="text-gray-300 font-normal">Not set</span>}</p>
            </div>
          ))}
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Role</p>
            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-brand-50 text-brand-700">
              <Wrench className="w-3 h-3" /> Technician
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
