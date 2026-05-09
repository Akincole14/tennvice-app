"use client";

import { useState, useRef, useCallback } from "react";
import {
  Upload, X, Loader2, CheckCircle, AlertCircle, Clock,
  FileText, Sparkles, Trash2, ExternalLink, ShieldCheck, ShieldX,
} from "lucide-react";

type Certificate = {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  aiCertName:   string | null;
  aiIssuer:     string | null;
  aiHolder:     string | null;
  aiLicenceNo:  string | null;
  aiIssuedAt:   string | null;
  aiExpiresAt:  string | null;
  aiSummary:    string | null;
  aiConfidence: string | null;
  aiValid:      boolean;
  status:       string;
  createdAt:    Date;
};

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  PENDING:  { label: "Pending review", color: "bg-amber-50 text-amber-700 border-amber-200",  icon: Clock },
  VERIFIED: { label: "Verified",       color: "bg-green-50 text-green-700 border-green-200",  icon: ShieldCheck },
  REJECTED: { label: "Rejected",       color: "bg-red-50 text-red-700 border-red-200",         icon: ShieldX },
};

const confidenceColors: Record<string, string> = {
  HIGH:   "text-green-600",
  MEDIUM: "text-amber-600",
  LOW:    "text-red-500",
};

function UploadZone({ onUpload, uploading }: {
  onUpload: (file: File) => void;
  uploading: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onUpload(file);
  }, [onUpload]);

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !uploading && inputRef.current?.click()}
      className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
        dragging  ? "border-brand-400 bg-brand-50" :
        uploading ? "border-gray-200 bg-gray-50 cursor-not-allowed" :
                    "border-gray-300 hover:border-brand-400 hover:bg-brand-50"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f); }}
        disabled={uploading}
      />
      {uploading ? (
        <>
          <Loader2 className="w-8 h-8 text-brand-500 mx-auto mb-3 animate-spin" />
          <p className="text-sm font-medium text-gray-700">Uploading & analysing…</p>
          <p className="text-xs text-gray-400 mt-1">AI is reading your certificate</p>
        </>
      ) : (
        <>
          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-700">
            Drop a certificate here or <span className="text-brand-600">browse</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP or PDF · max 10 MB</p>
        </>
      )}
    </div>
  );
}

function CertCard({ cert, onDelete }: { cert: Certificate; onDelete: (id: string) => void }) {
  const [deleting, setDeleting] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const s = statusConfig[cert.status] ?? statusConfig.PENDING;
  const StatusIcon = s.icon;
  const hasAi = !!cert.aiSummary;

  async function remove() {
    setDeleting(true);
    await fetch(`/api/certificates/${cert.id}`, { method: "DELETE" });
    onDelete(cert.id);
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="p-2 bg-gray-50 rounded-xl shrink-0">
              {cert.fileType === "application/pdf"
                ? <FileText className="w-5 h-5 text-red-500" />
                : <FileText className="w-5 h-5 text-blue-500" />}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 truncate">
                {cert.aiCertName ?? cert.fileName}
              </p>
              {cert.aiIssuer && (
                <p className="text-sm text-gray-500 mt-0.5">{cert.aiIssuer}</p>
              )}
              {!cert.aiCertName && (
                <p className="text-xs text-gray-400 truncate">{cert.fileName}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${s.color}`}>
              <StatusIcon className="w-3 h-3" />
              {s.label}
            </span>
            <a
              href={cert.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
              title="View file"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={remove}
              disabled={deleting}
              className="p-1.5 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40"
              title="Delete"
            >
              {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Quick facts row */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-gray-500">
          {cert.aiLicenceNo  && <span>Licence: <span className="font-mono font-medium text-gray-700">{cert.aiLicenceNo}</span></span>}
          {cert.aiIssuedAt   && <span>Issued: <span className="font-medium text-gray-700">{cert.aiIssuedAt}</span></span>}
          {cert.aiExpiresAt  && <span>Expires: <span className="font-medium text-gray-700">{cert.aiExpiresAt}</span></span>}
          {cert.aiHolder     && <span>Holder: <span className="font-medium text-gray-700">{cert.aiHolder}</span></span>}
        </div>
      </div>

      {/* AI analysis panel */}
      {hasAi && (
        <div className="border-t border-gray-100">
          <button
            onClick={() => setExpanded(e => !e)}
            className="w-full flex items-center gap-2 px-5 py-3 text-xs font-medium text-gray-500 hover:bg-gray-50 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-brand-500" />
            AI analysis
            <span className={`ml-1 font-semibold ${confidenceColors[cert.aiConfidence ?? ""]}`}>
              {cert.aiConfidence ? `· ${cert.aiConfidence} confidence` : ""}
            </span>
            <span className={`ml-auto flex items-center gap-1 ${cert.aiValid ? "text-green-600" : "text-red-500"}`}>
              {cert.aiValid
                ? <><CheckCircle className="w-3.5 h-3.5" /> Appears genuine</>
                : <><AlertCircle className="w-3.5 h-3.5" /> Could not verify</>}
            </span>
            <span className="ml-2 text-gray-400">{expanded ? "▲" : "▼"}</span>
          </button>
          {expanded && (
            <div className="px-5 pb-4 text-sm text-gray-600 bg-gray-50 leading-relaxed">
              {cert.aiSummary}
            </div>
          )}
        </div>
      )}

      {/* No AI yet */}
      {!hasAi && (
        <div className="border-t border-gray-100 px-5 py-3 flex items-center gap-2 text-xs text-gray-400">
          <Clock className="w-3.5 h-3.5" />
          AI verification pending — will run once the API key is configured
        </div>
      )}
    </div>
  );
}

export default function CertificatesClient({
  certificates: initial,
  aiEnabled,
}: {
  certificates: Certificate[];
  aiEnabled: boolean;
}) {
  const [certificates, setCertificates] = useState(initial);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadFile(file: File) {
    setUploading(true);
    setError(null);
    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("/api/certificates", { method: "POST", body: fd });
    const data = await res.json();
    setUploading(false);

    if (!res.ok) { setError(data.error ?? "Upload failed"); return; }
    setCertificates(c => [data, ...c]);
  }

  function remove(id: string) {
    setCertificates(c => c.filter(x => x.id !== id));
  }

  return (
    <div className="space-y-5">
      {!aiEnabled && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 text-sm text-amber-700">
          <Sparkles className="w-4 h-4 mt-0.5 shrink-0" />
          <p>
            <span className="font-semibold">AI verification is not yet active.</span> Add{" "}
            <code className="font-mono text-xs bg-amber-100 px-1 py-0.5 rounded">ANTHROPIC_API_KEY</code>{" "}
            to your environment to enable automatic certificate analysis. Uploads still work — the AI will
            process any pending certificates once the key is added.
          </p>
        </div>
      )}

      <UploadZone onUpload={uploadFile} uploading={uploading} />

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {certificates.length === 0 ? (
        <div className="text-center text-sm text-gray-400 py-4">
          No certificates uploaded yet.
        </div>
      ) : (
        <div className="space-y-3">
          {certificates.map(c => (
            <CertCard key={c.id} cert={c} onDelete={remove} />
          ))}
        </div>
      )}
    </div>
  );
}
