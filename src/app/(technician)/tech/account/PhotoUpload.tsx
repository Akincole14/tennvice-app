"use client";

import { useRef, useState } from "react";
import { Camera, Loader2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PhotoUpload({
  technicianId,
  name,
  currentPhoto,
}: {
  technicianId: string;
  name: string;
  currentPhoto: string | null;
}) {
  const router  = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [photo,      setPhoto]      = useState(currentPhoto);
  const [uploading,  setUploading]  = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    const fd = new FormData();
    fd.append("photo", file);
    const res  = await fetch(`/api/technicians/${technicianId}/photo`, { method: "POST", body: fd });
    const data = await res.json();
    setUploading(false);
    if (!res.ok) { setError(data.error ?? "Upload failed"); return; }
    setPhoto(data.imageUrl);
    router.refresh();
    e.target.value = "";
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h2 className="font-semibold text-gray-900 mb-5">Profile photo</h2>

      <div className="flex items-center gap-6">
        {/* Clickable avatar */}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="relative group w-24 h-24 rounded-full overflow-hidden shrink-0 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
          aria-label="Change profile photo"
        >
          {photo ? (
            <img src={photo} alt={name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-3xl">
              {name.charAt(0).toUpperCase() || "T"}
            </div>
          )}
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            {uploading
              ? <Loader2 className="w-6 h-6 text-white animate-spin" />
              : <Camera className="w-6 h-6 text-white" />}
            {!uploading && <span className="text-white text-[10px] font-medium mt-1">Change</span>}
          </div>
        </button>

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleChange}
          disabled={uploading}
        />

        {/* Info + CTA */}
        <div>
          <p className="font-medium text-gray-900">{name || "Your name"}</p>
          <p className="text-xs text-gray-400 mt-0.5 mb-3">JPEG, PNG or WebP · Max 5 MB</p>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="text-sm font-medium px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {uploading ? "Uploading…" : photo ? "Change photo" : "Upload photo"}
          </button>

          {error && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-red-600">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
