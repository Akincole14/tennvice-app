"use client";

import { useState } from "react";
import { X, CalendarPlus, Sparkles, Loader2 } from "lucide-react";

interface Property {
  id: string;
  address: string;
}

interface BookVisitModalProps {
  properties: Property[];
  onClose: () => void;
  onSuccess: () => void;
  initialTab?: "manual" | "ai";
}

const VISIT_TYPES = [
  { value: "ROUTINE_BOTH",       label: "Plumbing & Electrical" },
  { value: "ROUTINE_PLUMBING",   label: "Routine Plumbing" },
  { value: "ROUTINE_ELECTRICAL", label: "Routine Electrical" },
  { value: "BOILER_SERVICE",     label: "Boiler Service" },
  { value: "EMERGENCY",          label: "Emergency" },
];

export default function BookVisitModal({ properties, onClose, onSuccess, initialTab = "manual" }: BookVisitModalProps) {
  const [tab, setTab] = useState<"manual" | "ai">(initialTab);

  // Manual form state
  const [propertyId, setPropertyId] = useState(properties[0]?.id ?? "");
  const [visitType, setVisitType] = useState("ROUTINE_BOTH");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("09:00");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // AI state
  const [aiPropertyId, setAiPropertyId] = useState(properties[0]?.id ?? "");
  const [aiLoading, setAiLoading] = useState(false);
  const [manualTechnician, setManualTechnician] = useState<{ name: string | null; distanceMiles: number | null; reason: string } | null>(null);
  const [aiResult, setAiResult] = useState<{ message: string; visits: { date: string; type: string }[]; technicianName?: string | null; assignmentReason?: string | null } | null>(null);
  const [aiError, setAiError] = useState("");

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split("T")[0];

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!date) { setError("Please select a date."); return; }
    setSubmitting(true);
    try {
      const scheduledAt = new Date(`${date}T${time}:00`).toISOString();
      const res = await fetch("/api/portal/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId, type: visitType, scheduledAt }),
      });
      let data: any = {};
      try { data = await res.json(); } catch { /* non-JSON */ }
      if (!res.ok) {
        setError(data.error ?? "Failed to book visit.");
      } else {
        setManualTechnician({
          name: data.technicianName ?? null,
          distanceMiles: data.distanceMiles ?? null,
          reason: data.assignmentReason ?? "",
        });
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAiSchedule() {
    setAiError("");
    setAiResult(null);
    setAiLoading(true);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 55000);
      const res = await fetch("/api/portal/visits/ai-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId: aiPropertyId }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      let data: any = {};
      try { data = await res.json(); } catch { /* non-JSON body */ }
      if (!res.ok) {
        setAiError(data.error ?? `Scheduling failed (${res.status}).`);
      } else {
        setAiResult(data);
      }
    } catch (err: any) {
      if (err?.name === "AbortError") {
        setAiError("Request timed out. Please try again.");
      } else {
        setAiError("Network error. Please try again.");
      }
    } finally {
      setAiLoading(false);
    }
  }

  const typeLabel = (t: string) => VISIT_TYPES.find((v) => v.value === t)?.label ?? t;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 text-lg">Book a visit</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setTab("manual")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
              tab === "manual"
                ? "text-brand-600 border-b-2 border-brand-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <CalendarPlus className="w-4 h-4" />
            Manual booking
          </button>
          <button
            onClick={() => setTab("ai")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
              tab === "ai"
                ? "text-brand-600 border-b-2 border-brand-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Auto-schedule with AI
          </button>
        </div>

        <div className="p-5">
          {tab === "manual" ? (
            manualTechnician ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-green-800 mb-1">Visit booked!</p>
                  {manualTechnician.name ? (
                    <>
                      <p className="text-sm text-green-700">
                        <span className="font-medium">{manualTechnician.name}</span>
                        {manualTechnician.distanceMiles !== null ? ` (${manualTechnician.distanceMiles} miles away)` : ""} has been assigned.
                      </p>
                      {manualTechnician.reason && (
                        <p className="text-xs text-green-600 mt-1">{manualTechnician.reason}</p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-green-700">A technician will be assigned shortly.</p>
                  )}
                </div>
                <button
                  onClick={onSuccess}
                  className="w-full bg-brand-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors"
                >
                  View my visits
                </button>
              </div>
            ) : (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              {/* Property */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Property</label>
                <select
                  value={propertyId}
                  onChange={(e) => setPropertyId(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                >
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>{p.address}</option>
                  ))}
                </select>
              </div>

              {/* Visit type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Visit type</label>
                <select
                  value={visitType}
                  onChange={(e) => setVisitType(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {VISIT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {/* Date & time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
                  <input
                    type="date"
                    value={date}
                    min={minDateStr}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Time</label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-brand-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {submitting ? "Booking…" : "Book visit"}
                </button>
              </div>
            </form>
            )
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 leading-relaxed">
                Our AI will analyse your plan and automatically schedule your remaining visits for the year,
                spaced evenly to give your home the best coverage.
              </p>

              {/* Property */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Property</label>
                <select
                  value={aiPropertyId}
                  onChange={(e) => setAiPropertyId(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>{p.address}</option>
                  ))}
                </select>
              </div>

              {/* Result */}
              {aiResult && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-green-800 mb-2">{aiResult.message}</p>
                  {aiResult.visits.length > 0 && (
                    <ul className="space-y-1 mb-3">
                      {aiResult.visits.map((v, i) => (
                        <li key={i} className="text-sm text-green-700">
                          {new Date(v.date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
                          {" — "}{typeLabel(v.type)}
                        </li>
                      ))}
                    </ul>
                  )}
                  {aiResult.technicianName && (
                    <div className="pt-2 border-t border-green-200">
                      <p className="text-sm text-green-700">
                        <span className="font-medium">Technician assigned:</span> {aiResult.technicianName}
                      </p>
                      {aiResult.assignmentReason && (
                        <p className="text-xs text-green-600 mt-0.5">{aiResult.assignmentReason}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {aiError && <p className="text-sm text-red-600">{aiError}</p>}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  {aiResult ? "Close" : "Cancel"}
                </button>
                {!aiResult && (
                  <button
                    onClick={handleAiSchedule}
                    disabled={aiLoading}
                    className="flex-1 bg-brand-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {aiLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {aiLoading ? "Scheduling…" : "Schedule with AI"}
                  </button>
                )}
                {aiResult && aiResult.visits.length > 0 && (
                  <button
                    onClick={onSuccess}
                    className="flex-1 bg-brand-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors"
                  >
                    View visits
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
