"use client";

import { useRef, useState, useEffect } from "react";
import { Pencil, X, Loader2, CheckCircle, AlertCircle, Wrench, Camera, Upload, VideoIcon } from "lucide-react";
import AddressSearch from "@/components/AddressSearch";
import { useRouter } from "next/navigation";

type Technician = {
  id: string;
  qualification:   string | null;
  licenceNumber:   string | null;
  address:         string | null;
  nokName:         string | null;
  nokPhone:        string | null;
  nokRelationship: string | null;
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

export default function TechnicianProfile({ technician, isSenior = true }: { technician: Technician; isSenior?: boolean }) {
  const router  = useRouter();
  const fileRef       = useRef<HTMLInputElement>(null);
  const videoRef      = useRef<HTMLVideoElement>(null);
  const canvasRef     = useRef<HTMLCanvasElement>(null);
  const streamRef     = useRef<MediaStream | null>(null);
  const lightingTimer = useRef<ReturnType<typeof setInterval>>();

  const [editing, setEditing] = useState(false);
  const [photo,   setPhoto]   = useState(technician.user.image);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError,     setPhotoError]     = useState<string | null>(null);
  const [cameraOpen,  setCameraOpen]  = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [lightingWarn, setLightingWarn] = useState<"dark" | "bright" | null>(null);

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
      if (blob) uploadPhoto(new File([blob], "camera-photo.jpg", { type: "image/jpeg" }));
      closeCamera();
    }, "image/jpeg", 0.92);
  }

  const [name,            setName]            = useState(technician.user.name ?? "");
  const [email,           setEmail]           = useState(technician.user.email ?? "");
  const [phone,           setPhone]           = useState(technician.user.phone ?? "");
  const [qualification,   setQualification]   = useState(technician.qualification ?? "");
  const [licenceNumber,   setLicenceNumber]   = useState(technician.licenceNumber ?? "");
  const [address,         setAddress]         = useState(technician.address ?? "");
  const [nokName,         setNokName]         = useState(technician.nokName ?? "");
  const [nokPhone,        setNokPhone]        = useState(technician.nokPhone ?? "");
  const [nokRelationship, setNokRelationship] = useState(technician.nokRelationship ?? "");
  const [newPassword,     setNewPassword]     = useState("");

  const [loading, setLoading] = useState(false);
  const [status,  setStatus]  = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function uploadPhoto(file: File) {
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
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadPhoto(file);
    e.target.value = "";
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    const res = await fetch(`/api/technicians/${technician.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name, email, phone, qualification, licenceNumber, newPassword: newPassword || undefined,
        address, nokName, nokPhone, nokRelationship,
      }),
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
    <>
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-200">
              {photo ? (
                <img src={photo} alt={name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-2xl">
                  {name.charAt(0) || "T"}
                </div>
              )}
            </div>
            {photoUploading && (
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              </div>
            )}
          </div>

          <div>
            <h1 className="text-xl font-bold text-gray-900">{name || "—"}</h1>
            <p className="text-sm text-gray-500">{email}</p>
            {photoError && <p className="text-xs text-red-600 mt-0.5">{photoError}</p>}
            {cameraError && <p className="text-xs text-red-600 mt-0.5">{cameraError}</p>}
            <div className="flex items-center gap-2 mt-1.5">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={photoUploading}
                className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-800 disabled:opacity-40"
              >
                <Upload className="w-3 h-3" />
                {photoUploading ? "Uploading…" : "Change photo"}
              </button>
              <span className="text-gray-300 text-xs">|</span>
              <button
                type="button"
                onClick={openCamera}
                disabled={photoUploading}
                className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-800 disabled:opacity-40"
              >
                <VideoIcon className="w-3 h-3" />
                Take photo
              </button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handlePhotoChange}
              disabled={photoUploading}
            />
            <canvas ref={canvasRef} className="hidden" />
          </div>
        </div>

        {isSenior && (
          <button
            onClick={() => { setEditing(e => !e); setStatus(null); }}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 border border-gray-200 px-3 py-1.5 rounded-xl transition-colors"
          >
            {editing ? <><X className="w-3.5 h-3.5" /> Cancel</> : <><Pencil className="w-3.5 h-3.5" /> Edit</>}
          </button>
        )}
      </div>

      {editing ? (
        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Full name"    value={name}        onChange={setName} />
            <Field label="Email"        type="email"  value={email}       onChange={setEmail} />
            <Field label="Phone"        type="tel"    value={phone}       onChange={setPhone} />
            <Field label="New password" type="password" value={newPassword} onChange={setNewPassword} />
          </div>
          <div className="border-t border-gray-100 pt-4 space-y-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Address</p>
            <AddressSearch value={address} onChange={setAddress} />
          </div>
          <div className="border-t border-gray-100 pt-4 grid grid-cols-2 gap-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide col-span-2">Professional credentials</p>
            <Field label="Qualification"  value={qualification} onChange={setQualification} />
            <Field label="Licence number" value={licenceNumber} onChange={setLicenceNumber} />
          </div>
          <div className="border-t border-gray-100 pt-4 space-y-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Next of kin</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Field label="Full name"     value={nokName}         onChange={setNokName} />
              </div>
              <Field label="Phone number"    value={nokPhone}        onChange={setNokPhone} />
              <Field label="Relationship"    value={nokRelationship} onChange={setNokRelationship} />
            </div>
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
        <div className="space-y-4 text-sm">
          {/* Contact & role */}
          <div className="grid grid-cols-2 gap-4">
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

          {/* Address */}
          {technician.address && (
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs text-gray-400 mb-0.5">Address</p>
              <p className="font-medium text-gray-800">{technician.address}</p>
            </div>
          )}

          {/* Next of kin */}
          {(technician.nokName || technician.nokPhone) && (
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Next of kin</p>
              <div className="grid grid-cols-2 gap-4">
                {technician.nokName && (
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Name</p>
                    <p className="font-medium text-gray-800">{technician.nokName}</p>
                  </div>
                )}
                {technician.nokPhone && (
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Phone</p>
                    <p className="font-medium text-gray-800">{technician.nokPhone}</p>
                  </div>
                )}
                {technician.nokRelationship && (
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Relationship</p>
                    <p className="font-medium text-gray-800">{technician.nokRelationship}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>

      {/* Camera overlay */}
      {cameraOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-black rounded-2xl overflow-hidden w-full max-w-md shadow-2xl">

            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full max-h-72 object-cover"
              />

              {/* Face guide overlay */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                preserveAspectRatio="none"
              >
                <defs>
                  <mask id="face-cutout-edit">
                    <rect width="100%" height="100%" fill="white" />
                    <ellipse cx="50%" cy="48%" rx="29%" ry="38%" fill="black" />
                  </mask>
                </defs>
                <rect width="100%" height="100%" fill="rgba(0,0,0,0.45)" mask="url(#face-cutout-edit)" />
                <ellipse
                  cx="50%" cy="48%" rx="29%" ry="38%"
                  fill="none"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeDasharray="10 5"
                  opacity="0.85"
                />
              </svg>

              {/* Label */}
              <div className="absolute bottom-3 left-0 right-0 flex justify-center pointer-events-none">
                <span className="text-white text-[11px] font-medium bg-black/50 px-3 py-1 rounded-full tracking-wide">
                  Place your face here
                </span>
              </div>

              {/* Lighting warning */}
              {lightingWarn && (
                <div className="absolute top-2 left-2 right-2 flex items-center gap-2 bg-amber-500/90 backdrop-blur-sm text-white text-xs font-medium px-3 py-2 rounded-xl">
                  <span className="text-base leading-none">{lightingWarn === "dark" ? "🌑" : "☀️"}</span>
                  {lightingWarn === "dark"
                    ? "Too dark — move to a brighter area or turn on a light"
                    : "Too bright — avoid direct light or a bright window behind you"}
                </div>
              )}
            </div>

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
        </div>
      )}
    </>
  );
}
