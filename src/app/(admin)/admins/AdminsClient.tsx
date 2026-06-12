"use client";

import { useRef, useState, useEffect } from "react";
import { Plus, X, Loader2, AlertCircle, CheckCircle, ShieldCheck, Shield, Camera, Upload, VideoIcon } from "lucide-react";

type AdminUser = {
  id: string;
  name: string | null;
  email: string | null;
  adminRole: string | null;
  createdAt: string;
};

function SetUpAdminModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", adminRole: "STANDARD" });
  const [photoFile,    setPhotoFile]    = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [cameraOpen,   setCameraOpen]   = useState(false);
  const [cameraError,  setCameraError]  = useState<string | null>(null);
  const [lightingWarn, setLightingWarn] = useState<"dark" | "bright" | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const fileRef       = useRef<HTMLInputElement>(null);
  const videoRef      = useRef<HTMLVideoElement>(null);
  const canvasRef     = useRef<HTMLCanvasElement>(null);
  const streamRef     = useRef<MediaStream | null>(null);
  const lightingTimer = useRef<ReturnType<typeof setInterval>>();

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

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
      if (blob) {
        const file = new File([blob], "camera-photo.jpg", { type: "image/jpeg" });
        setPhotoFile(file);
      }
      closeCamera();
    }, "image/jpeg", 0.92);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setPhotoFile(file);
    e.target.value = "";
  }

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

    if (!res.ok) {
      setLoading(false);
      setError(data.error ?? "Something went wrong");
      return;
    }

    if (photoFile && data.id) {
      const fd = new FormData();
      fd.append("photo", photoFile);
      await fetch(`/api/admins/${data.id}/photo`, { method: "POST", body: fd });
    }

    setLoading(false);
    onCreated();
  }

  const initial = form.name?.charAt(0)?.toUpperCase() || "A";

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col max-h-[90vh]">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
            <h2 className="font-semibold text-gray-900">Set up Admin</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
          </div>

          {/* Scrollable body */}
          <form onSubmit={submit} id="admin-form" className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

            {/* Photo */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Photo</label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-200 shrink-0 bg-brand-100 flex items-center justify-center">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-brand-700 font-bold text-xl">{initial}</span>
                  )}
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      {photoPreview ? "Change photo" : "Upload photo"}
                    </button>
                    <button
                      type="button"
                      onClick={openCamera}
                      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <VideoIcon className="w-3.5 h-3.5" />
                      Take photo
                    </button>
                  </div>
                  {cameraError && (
                    <p className="flex items-center gap-1 text-xs text-red-600">
                      <AlertCircle className="w-3 h-3 shrink-0" />{cameraError}
                    </p>
                  )}
                </div>
              </div>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />
              <canvas ref={canvasRef} className="hidden" />
            </div>

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
          </form>

          {/* Footer */}
          <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 shrink-0">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-xl">Cancel</button>
            <button
              type="submit"
              form="admin-form"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 bg-brand-600 text-white text-sm font-medium rounded-xl hover:bg-brand-700 disabled:opacity-60"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Create admin
            </button>
          </div>
        </div>
      </div>

      {/* Camera overlay */}
      {cameraOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-black rounded-2xl overflow-hidden w-full max-w-md shadow-2xl">
            <div className="relative">
              <video ref={videoRef} autoPlay playsInline muted className="w-full max-h-72 object-cover" />
              <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
                <defs>
                  <mask id="face-cutout-new-admin">
                    <rect width="100%" height="100%" fill="white" />
                    <ellipse cx="50%" cy="48%" rx="29%" ry="38%" fill="black" />
                  </mask>
                </defs>
                <rect width="100%" height="100%" fill="rgba(0,0,0,0.45)" mask="url(#face-cutout-new-admin)" />
                <ellipse cx="50%" cy="48%" rx="29%" ry="38%" fill="none" stroke="white" strokeWidth="1.5" strokeDasharray="10 5" opacity="0.85" />
              </svg>
              <div className="absolute bottom-3 left-0 right-0 flex justify-center pointer-events-none">
                <span className="text-white text-[11px] font-medium bg-black/50 px-3 py-1 rounded-full tracking-wide">Place your face here</span>
              </div>
              {lightingWarn && (
                <div className="absolute top-2 left-2 right-2 flex items-center gap-2 bg-amber-500/90 backdrop-blur-sm text-white text-xs font-medium px-3 py-2 rounded-xl">
                  <span className="text-base leading-none">{lightingWarn === "dark" ? "🌑" : "☀️"}</span>
                  {lightingWarn === "dark" ? "Too dark — move to a brighter area or turn on a light" : "Too bright — avoid direct light or a bright window behind you"}
                </div>
              )}
            </div>
            <div className="flex items-center justify-center gap-3 px-4 py-3 bg-black/70">
              <button type="button" onClick={snapPhoto} className="flex items-center gap-2 px-5 py-2 bg-white text-gray-900 text-sm font-semibold rounded-xl hover:bg-gray-100 transition-colors">
                <Camera className="w-4 h-4" /> Snap photo
              </button>
              <button type="button" onClick={closeCamera} className="px-4 py-2 text-sm text-white/70 hover:text-white rounded-xl transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
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
