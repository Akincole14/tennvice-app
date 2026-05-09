"use client";

import { useState } from "react";
import {
  FileText, ExternalLink, ShieldCheck, ShieldX, Clock,
  Sparkles, CheckCircle, AlertCircle, Loader2, Upload,
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

function CertRow({ cert, onStatusChange }: {
  cert: Certificate;
  onStatusChange: (id: string, status: string) => void;
}) {
  const [updating, setUpdating] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const s = statusConfig[cert.status] ?? statusConfig.PENDING;
  const StatusIcon = s.icon;

  async function setStatus(status: string) {
    setUpdating(true);
    await fetch(`/api/certificates/${cert.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setUpdating(false);
    onStatusChange(cert.id, status);
  }

  return (
    <div className="border-b border-gray-100 last:border-0">
      <div className="flex items-start gap-4 px-6 py-4">
        <div className="p-2 bg-gray-50 rounded-xl shrink-0 mt-0.5">
          <FileText className={`w-4 h-4 ${cert.fileType === "application/pdf" ? "text-red-400" : "text-blue-400"}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <p className="font-medium text-gray-900">
                {cert.aiCertName ?? cert.fileName}
              </p>
              {cert.aiIssuer && <p className="text-sm text-gray-500">{cert.aiIssuer}</p>}
              {!cert.aiCertName && <p className="text-xs text-gray-400 mt-0.5">{cert.fileName}</p>}
              <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1.5 text-xs text-gray-400">
                {cert.aiLicenceNo  && <span>Licence: <span className="font-mono text-gray-600">{cert.aiLicenceNo}</span></span>}
                {cert.aiIssuedAt   && <span>Issued: <span className="text-gray-600">{cert.aiIssuedAt}</span></span>}
                {cert.aiExpiresAt  && <span>Expires: <span className="text-gray-600">{cert.aiExpiresAt}</span></span>}
                {cert.aiHolder     && <span>Holder: <span className="text-gray-600">{cert.aiHolder}</span></span>}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${s.color}`}>
                <StatusIcon className="w-3 h-3" />
                {s.label}
              </span>
              <a href={cert.fileUrl} target="_blank" rel="noopener noreferrer"
                className="p-1.5 text-gray-400 hover:text-gray-600" title="View file">
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* AI summary toggle */}
          {cert.aiSummary && (
            <div className="mt-3">
              <button
                onClick={() => setExpanded(e => !e)}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-brand-500" />
                AI analysis
                <span className={`font-semibold ${confidenceColors[cert.aiConfidence ?? ""]}`}>
                  {cert.aiConfidence ? `· ${cert.aiConfidence}` : ""}
                </span>
                <span className={`flex items-center gap-0.5 ml-1 ${cert.aiValid ? "text-green-600" : "text-red-500"}`}>
                  {cert.aiValid
                    ? <><CheckCircle className="w-3 h-3" /> Appears genuine</>
                    : <><AlertCircle className="w-3 h-3" /> Could not verify</>}
                </span>
                <span className="ml-1 text-gray-400">{expanded ? "▲" : "▼"}</span>
              </button>
              {expanded && (
                <p className="mt-2 text-sm text-gray-600 bg-gray-50 rounded-xl px-4 py-3 leading-relaxed">
                  {cert.aiSummary}
                </p>
              )}
            </div>
          )}
          {!cert.aiSummary && (
            <p className="mt-2 text-xs text-gray-400 flex items-center gap-1">
              <Clock className="w-3 h-3" /> AI analysis pending
            </p>
          )}

          {/* Admin actions */}
          {cert.status !== "VERIFIED" && cert.status !== "REJECTED" && (
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setStatus("VERIFIED")}
                disabled={updating}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {updating ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3" />}
                Verify
              </button>
              <button
                onClick={() => setStatus("REJECTED")}
                disabled={updating}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"
              >
                {updating ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldX className="w-3 h-3" />}
                Reject
              </button>
            </div>
          )}
          {cert.status !== "PENDING" && (
            <button
              onClick={() => setStatus("PENDING")}
              disabled={updating}
              className="mt-2 text-xs text-gray-400 hover:text-gray-600 underline"
            >
              Reset to pending
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminCertificates({
  certificates: initial,
  technicianId,
}: {
  certificates: Certificate[];
  technicianId: string;
}) {
  const [certs, setCerts] = useState(initial);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  function handleStatusChange(id: string, status: string) {
    setCerts(c => c.map(x => x.id === id ? { ...x, status } : x));
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("technicianId", technicianId);
    const res = await fetch("/api/certificates", { method: "POST", body: fd });
    const data = await res.json();
    setUploading(false);
    if (!res.ok) { setUploadError(data.error ?? "Upload failed"); return; }
    setCerts(c => [data, ...c]);
    e.target.value = "";
  }

  const verified  = certs.filter(c => c.status === "VERIFIED").length;
  const pending   = certs.filter(c => c.status === "PENDING").length;
  const rejected  = certs.filter(c => c.status === "REJECTED").length;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-gray-900">Qualifications & certificates</h2>
          <div className="flex gap-2 text-xs">
            {verified > 0 && <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">{verified} verified</span>}
            {pending  > 0 && <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">{pending} pending</span>}
            {rejected > 0 && <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">{rejected} rejected</span>}
          </div>
        </div>
        <label className="flex items-center gap-1.5 text-xs font-medium text-brand-600 border border-brand-200 px-3 py-1.5 rounded-lg hover:bg-brand-50 cursor-pointer transition-colors">
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          Upload
          <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>

      {uploadError && (
        <div className="px-6 py-3 text-sm text-red-700 bg-red-50 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {uploadError}
        </div>
      )}

      {certs.length === 0 ? (
        <p className="px-6 py-10 text-sm text-center text-gray-400">No certificates uploaded yet.</p>
      ) : (
        <div>
          {certs.map(c => (
            <CertRow key={c.id} cert={c} onStatusChange={handleStatusChange} />
          ))}
        </div>
      )}
    </div>
  );
}
