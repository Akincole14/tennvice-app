"use client";

import { useRef, useState, useEffect } from "react";
import { Camera, Loader2, AlertCircle, Upload, VideoIcon } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminPhotoUpload({
  name,
  currentPhoto,
}: {
  name: string;
  currentPhoto: string | null;
}) {
  const router = useRouter();
  const fileRef       = useRef<HTMLInputElement>(null);
  const videoRef      = useRef<HTMLVideoElement>(null);
  const canvasRef     = useRef<HTMLCanvasElement>(null);
  const streamRef     = useRef<MediaStream | null>(null);
  const lightingTimer = useRef<ReturnType<typeof setInterval>>();

  const [photo,        setPhoto]        = useState(currentPhoto);
  const [uploading,    setUploading]    = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [cameraOpen,   setCameraOpen]   = useState(false);
  const [cameraError,  setCameraError]  = useState<string | null>(null);
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

  async function uploadPhoto(file: File) {
    setUploading(true);
    setError(null);
    const fd = new FormData();
    fd.append("photo", file);
    const res  = await fetch("/api/account/photo", { method: "POST", body: fd });
    const data = await res.json();
    setUploading(false);
    if (!res.ok) { setError(data.error ?? "Upload failed"); return; }
    setPhoto(data.imageUrl);
    router.refresh();
  }

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadPhoto(file);
    e.target.value = "";
  }

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

  const initial = name.charAt(0).toUpperCase() || "A";

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-5">Profile photo</h2>

        <div className="flex items-center gap-6">
          <div className="relative w-24 h-24 rounded-full overflow-hidden shrink-0 border-2 border-gray-200">
            {photo ? (
              <img src={photo} alt={name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-brand-600 flex items-center justify-center text-white font-bold text-3xl">
                {initial}
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              </div>
            )}
          </div>

          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleChange} disabled={uploading} />
          <canvas ref={canvasRef} className="hidden" />

          <div>
            <p className="font-medium text-gray-900">{name || "Admin"}</p>
            <p className="text-xs text-gray-400 mt-0.5 mb-3">JPEG, PNG or WebP · Max 5 MB</p>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors">
                <Upload className="w-4 h-4" />
                {uploading ? "Uploading…" : photo ? "Change photo" : "Upload photo"}
              </button>
              <button type="button" onClick={openCamera} disabled={uploading}
                className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors">
                <VideoIcon className="w-4 h-4" />
                Take photo
              </button>
            </div>
            {error && <p className="mt-2 flex items-center gap-1.5 text-xs text-red-600"><AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}</p>}
            {cameraError && <p className="mt-2 flex items-center gap-1.5 text-xs text-red-600"><AlertCircle className="w-3.5 h-3.5 shrink-0" /> {cameraError}</p>}
          </div>
        </div>
      </div>

      {cameraOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-black rounded-2xl overflow-hidden w-full max-w-md shadow-2xl">
            <div className="relative">
              <video ref={videoRef} autoPlay playsInline muted className="w-full max-h-72 object-cover" />
              <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
                <defs>
                  <mask id="face-cutout-admin">
                    <rect width="100%" height="100%" fill="white" />
                    <ellipse cx="50%" cy="48%" rx="29%" ry="38%" fill="black" />
                  </mask>
                </defs>
                <rect width="100%" height="100%" fill="rgba(0,0,0,0.45)" mask="url(#face-cutout-admin)" />
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
