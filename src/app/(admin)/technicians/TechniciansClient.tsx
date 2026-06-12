"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Search, Plus, X, Loader2, AlertCircle, CheckCircle, Camera, Upload, VideoIcon } from "lucide-react";
import AddressSearch from "@/components/AddressSearch";

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
    address: "",
    nokName: "", nokPhone: "", nokRelationship: "",
  });
  const [photoFile,     setPhotoFile]     = useState<File | null>(null);
  const [photoPreview,  setPhotoPreview]  = useState<string | null>(null);
  const [cameraOpen,    setCameraOpen]    = useState(false);
  const [cameraError,   setCameraError]   = useState<string | null>(null);
  const [lightingWarn,  setLightingWarn]  = useState<"dark" | "bright" | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const fileRef        = useRef<HTMLInputElement>(null);
  const videoRef       = useRef<HTMLVideoElement>(null);
  const canvasRef      = useRef<HTMLCanvasElement>(null);
  const streamRef      = useRef<MediaStream | null>(null);
  const lightingTimer  = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (!photoFile) return;
    const url = URL.createObjectURL(photoFile);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  useEffect(() => {
    if (cameraOpen && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraOpen]);

  // Lighting analysis — runs every 700ms while camera is open
  useEffect(() => {
    if (!cameraOpen) { clearInterval(lightingTimer.current); setLightingWarn(null); return; }
    lightingTimer.current = setInterval(() => {
      const video = videoRef.current;
      if (!video || video.readyState < 2) return;
      const tmp = document.createElement("canvas");
      tmp.width = 80; tmp.height = 60;
      const ctx = tmp.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, 80, 60);
      const pixels = ctx.getImageData(0, 0, 80, 60).data;
      let sum = 0;
      for (let i = 0; i < pixels.length; i += 4) {
        sum += 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
      }
      const avg = sum / (80 * 60);
      setLightingWarn(avg < 55 ? "dark" : avg > 205 ? "bright" : null);
    }, 700);
    return () => clearInterval(lightingTimer.current);
  }, [cameraOpen]);

  // Stop camera and lighting when modal unmounts
  useEffect(() => () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    clearInterval(lightingTimer.current);
  }, []);

  async function openCamera() {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      streamRef.current = stream;
      setCameraOpen(true);
    } catch {
      setCameraError("Camera access was denied or is unavailable on this device.");
    }
  }

  function closeCamera() {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCameraOpen(false);
    setCameraError(null);
    setLightingWarn(null);
  }

  function snapPhoto() {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob(blob => {
      if (blob) setPhotoFile(new File([blob], "camera-photo.jpg", { type: "image/jpeg" }));
      closeCamera();
    }, "image/jpeg", 0.92);
  }

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
    if (!res.ok) {
      setLoading(false);
      setError(data.error ?? "Something went wrong");
      return;
    }

    // Upload photo if selected
    if (photoFile && data.technician?.id) {
      const fd = new FormData();
      fd.append("photo", photoFile);
      await fetch(`/api/technicians/${data.technician.id}/photo`, { method: "POST", body: fd });
    }

    setLoading(false);
    onCreated();
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]">

        {/* Sticky header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h2 className="font-semibold text-gray-900">Add technician</h2>
          <button onClick={() => { closeCamera(); onClose(); }} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={submit} className="flex flex-col flex-1 min-h-0">

          {/* Scrollable body */}
          <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

            {/* Photo */}
            <div className="flex flex-col items-center gap-3 pb-1">
              {/* Avatar preview */}
              <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200 bg-gray-50 shrink-0">
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <Camera className="w-7 h-7" />
                  </div>
                )}
              </div>

              {/* Camera viewfinder */}
              {cameraOpen && (
                <div className="w-full rounded-2xl overflow-hidden bg-black">

                  {/* Video + overlays */}
                  <div className="relative">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full max-h-64 object-cover"
                      style={{ filter: "blur(0px)" }}
                    />

                    {/* Dark vignette + oval face guide */}
                    <svg
                      className="absolute inset-0 w-full h-full pointer-events-none"
                      preserveAspectRatio="none"
                    >
                      <defs>
                        <mask id="face-cutout">
                          <rect width="100%" height="100%" fill="white" />
                          <ellipse cx="50%" cy="48%" rx="29%" ry="38%" fill="black" />
                        </mask>
                      </defs>
                      {/* Darkened surround */}
                      <rect width="100%" height="100%" fill="rgba(0,0,0,0.45)" mask="url(#face-cutout)" />
                      {/* Oval guide border */}
                      <ellipse
                        cx="50%" cy="48%" rx="29%" ry="38%"
                        fill="none"
                        stroke="white"
                        strokeWidth="1.5"
                        strokeDasharray="10 5"
                        opacity="0.85"
                      />
                    </svg>

                    {/* "Place your face here" label */}
                    <div className="absolute bottom-3 left-0 right-0 flex justify-center pointer-events-none">
                      <span className="text-white text-[11px] font-medium bg-black/50 px-3 py-1 rounded-full tracking-wide">
                        Place your face here
                      </span>
                    </div>

                    {/* Lighting warning */}
                    {lightingWarn && (
                      <div className="absolute top-2 left-2 right-2 flex items-center gap-2 bg-amber-500/90 backdrop-blur-sm text-white text-xs font-medium px-3 py-2 rounded-xl">
                        <span className="text-base leading-none">
                          {lightingWarn === "dark" ? "🌑" : "☀️"}
                        </span>
                        {lightingWarn === "dark"
                          ? "Too dark — move to a brighter area or turn on a light"
                          : "Too bright — avoid direct light or a bright window behind you"}
                      </div>
                    )}
                  </div>

                  {/* Controls */}
                  <div className="flex items-center justify-center gap-3 px-4 py-3 bg-black/70">
                    <button
                      type="button"
                      onClick={snapPhoto}
                      className="flex items-center gap-2 px-5 py-2 bg-white text-gray-900 text-sm font-semibold rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <Camera className="w-4 h-4" />
                      Snap photo
                    </button>
                    <button
                      type="button"
                      onClick={closeCamera}
                      className="px-4 py-2 text-sm text-white/70 hover:text-white rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {cameraError && (
                <p className="text-xs text-red-600 text-center">{cameraError}</p>
              )}

              {/* Action buttons */}
              {!cameraOpen && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Upload photo
                  </button>
                  <button
                    type="button"
                    onClick={openCamera}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <VideoIcon className="w-3.5 h-3.5" />
                    Take photo
                  </button>
                  {photoFile && (
                    <button
                      type="button"
                      onClick={() => { setPhotoFile(null); setPhotoPreview(null); if (fileRef.current) fileRef.current.value = ""; }}
                      className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              )}

              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) setPhotoFile(f); }}
              />
              <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Personal details */}
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Personal details</p>
              <div className="grid grid-cols-2 gap-3">
                {([
                  ["Full name",     "name",     "text",     true,  "col-span-2"],
                  ["Email address", "email",    "email",    true,  "col-span-2"],
                  ["Phone number",  "phone",    "tel",      false, ""],
                  ["Password",      "password", "password", true,  ""],
                ] as const).map(([label, key, type, required, span]) => (
                  <div key={key} className={span}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      {label}{required && <span className="text-red-400 ml-0.5">*</span>}
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
            </div>

            {/* Address */}
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Address</p>
              <AddressSearch value={form.address} onChange={v => setForm(f => ({ ...f, address: v }))} />
            </div>

            {/* Professional credentials */}
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Professional credentials</p>
              <div className="grid grid-cols-2 gap-3">
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
            </div>

            {/* Next of kin */}
            <div className="border-t border-gray-100 pt-4 pb-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Next of kin</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Full name</label>
                  <input
                    type="text"
                    value={form.nokName}
                    onChange={set("nokName")}
                    placeholder="e.g. Jane Cooper"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Phone number</label>
                  <input
                    type="tel"
                    value={form.nokPhone}
                    onChange={set("nokPhone")}
                    placeholder="e.g. 07700 900123"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Relationship</label>
                  <input
                    type="text"
                    value={form.nokRelationship}
                    onChange={set("nokRelationship")}
                    placeholder="e.g. Spouse, Parent"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Sticky footer */}
          <div className="px-6 py-4 border-t border-gray-100 shrink-0 space-y-3">
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 shrink-0" />{error}
              </div>
            )}
            <div className="flex justify-end gap-2">
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
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search technicians…"
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-brand-600 text-white text-sm font-medium rounded-xl hover:bg-brand-700 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" /> <span>Add</span>
          </button>
        </div>

        {added && (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <CheckCircle className="w-4 h-4 shrink-0" /> Technician added successfully.
          </div>
        )}

        {/* Mobile cards */}
        <div className="md:hidden bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
          {filtered.length === 0 ? (
            <p className="text-center py-12 text-sm text-gray-400">No technicians match your search.</p>
          ) : filtered.map(t => {
            const now = new Date();
            const completed = t.visits.filter(v => v.status === "COMPLETED").length;
            const upcoming  = t.visits.filter(v => v.status === "SCHEDULED" && new Date(v.scheduledAt) >= now).length;
            const lastVisit = t.visits.find(v => v.status === "COMPLETED");
            return (
              <Link key={t.id} href={`/technicians/${t.id}`} className="flex items-center gap-3 px-4 py-4 hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-sm shrink-0">
                  {t.user.name?.charAt(0) ?? "T"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{t.user.name ?? "—"}</p>
                  <p className="text-xs text-gray-500 truncate">{t.user.email}</p>
                  {t.qualification && <p className="text-xs text-gray-400 truncate mt-0.5">{t.qualification}</p>}
                </div>
                <div className="text-right shrink-0 space-y-1">
                  <p className="text-xs font-semibold text-green-600">{completed} done</p>
                  <p className="text-xs font-semibold text-blue-600">{upcoming} upcoming</p>
                  {lastVisit && (
                    <p className="text-[10px] text-gray-400">
                      {new Date(lastVisit.scheduledAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Desktop table */}
        {filtered.length === 0 ? (
          <div className="hidden md:block bg-white rounded-2xl border border-gray-200 px-6 py-12 text-center text-sm text-gray-400">
            No technicians match your search.
          </div>
        ) : (
          <div className="hidden md:block bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
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
          </div>
        )}
      </div>
    </>
  );
}
