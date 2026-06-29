"use client";

import { useEffect, useRef, useState } from "react";
import { X, Calendar, CheckCircle, AlertCircle, Clock, Loader2, Users } from "lucide-react";

interface NearbyTech {
  id: string;
  name: string;
  distanceMiles: number;
  qualification: string;
}

interface AvailabilityResult {
  requestedTime: string;
  appointed: {
    id: string;
    name: string;
    available: boolean;
    nextSlot: string | null;
  } | null;
  alternatives: NearbyTech[];
}

interface RescheduleModalProps {
  visitId: string;
  currentScheduledAt: string;
  appointedTechName: string | null;
  propertyAddress: string;
  onClose: () => void;
  onSuccess: (newDate: string, techName: string | null) => void;
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long",
  });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export default function RescheduleModal({
  visitId,
  currentScheduledAt,
  appointedTechName,
  propertyAddress,
  onClose,
  onSuccess,
}: RescheduleModalProps) {
  const current = new Date(currentScheduledAt);
  const [date, setDate] = useState(current.toISOString().split("T")[0]);
  const [time, setTime] = useState(
    current.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false })
  );
  const [checking, setChecking] = useState(false);
  const [availability, setAvailability] = useState<AvailabilityResult | null>(null);
  const [selectedTechId, setSelectedTechId] = useState<string | "appointed">("appointed");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ date: string; techName: string | null } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split("T")[0];

  // Debounced availability check whenever date/time changes
  useEffect(() => {
    if (!date) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setAvailability(null);
    setSelectedTechId("appointed");

    debounceRef.current = setTimeout(async () => {
      setChecking(true);
      try {
        const res = await fetch(
          `/api/portal/visits/${visitId}/availability?date=${date}&time=${encodeURIComponent(time)}`
        );
        if (res.ok) {
          const data: AvailabilityResult = await res.json();
          setAvailability(data);
          // Pre-select appointed tech if available, else clear so user must choose
          if (data.appointed?.available) setSelectedTechId("appointed");
          else setSelectedTechId("");
        }
      } finally {
        setChecking(false);
      }
    }, 600);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [date, time, visitId]);

  async function handleSubmit() {
    if (!date) { setError("Please choose a date."); return; }
    if (!availability) { setError("Please wait for availability to load."); return; }
    if (!availability.appointed?.available && selectedTechId === "") {
      setError("Please select a technician for this time slot."); return;
    }
    setError("");
    setSubmitting(true);

    const scheduledAt = new Date(`${date}T${time}:00`).toISOString();
    const techId = selectedTechId === "appointed"
      ? availability.appointed?.id
      : selectedTechId || undefined;

    try {
      const res = await fetch(`/api/portal/visits/${visitId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledAt, technicianId: techId }),
      });
      let data: any = {};
      try { data = await res.json(); } catch { /* non-JSON */ }
      if (!res.ok) {
        setError(data.error ?? "Failed to reschedule.");
      } else {
        const techName =
          selectedTechId === "appointed"
            ? (appointedTechName ?? null)
            : (availability.alternatives.find((t) => t.id === selectedTechId)?.name ?? null);
        setDone({ date: scheduledAt, techName });
        onSuccess(scheduledAt, techName);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const isDateChanged = date !== current.toISOString().split("T")[0] ||
    time !== current.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });

  const canConfirm =
    isDateChanged &&
    !checking &&
    availability !== null &&
    (availability.appointed?.available || selectedTechId !== "");

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="font-semibold text-gray-900">Reschedule visit</h2>
            <p className="text-xs text-gray-400 mt-0.5">{propertyAddress}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Current booking info */}
          <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center gap-3 text-sm">
            <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
            <div>
              <p className="text-gray-500 text-xs">Current booking</p>
              <p className="font-medium text-gray-800">
                {fmt(currentScheduledAt)} at {fmtTime(currentScheduledAt)}
              </p>
            </div>
          </div>

          {/* Date + time pickers */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">New date &amp; time</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Date</label>
                <input
                  type="date"
                  value={date}
                  min={minDateStr}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Time</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
          </div>

          {/* Availability feedback */}
          {checking && (
            <div className="flex items-center gap-2.5 text-sm text-gray-500 py-1">
              <Loader2 className="w-4 h-4 animate-spin text-brand-500" />
              Checking {appointedTechName ?? "technician"}&apos;s availability…
            </div>
          )}

          {!checking && availability && (
            <div className="space-y-3">
              {availability.appointed ? (
                availability.appointed.available ? (
                  /* ✓ Available */
                  <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-green-800">
                        {availability.appointed.name} is available
                      </p>
                      <p className="text-xs text-green-600 mt-0.5">
                        {fmt(availability.requestedTime)} at {fmtTime(availability.requestedTime)}
                      </p>
                    </div>
                  </div>
                ) : (
                  /* ✗ Not available */
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                      <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-amber-800">
                          {availability.appointed.name} is not available at this time
                        </p>
                        {availability.appointed.nextSlot ? (
                          <p className="text-xs text-amber-700 mt-0.5 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Next available: {fmt(availability.appointed.nextSlot)} at {fmtTime(availability.appointed.nextSlot)}
                          </p>
                        ) : (
                          <p className="text-xs text-amber-700 mt-0.5">No availability found in the next 60 days.</p>
                        )}
                      </div>
                    </div>

                    {/* Use next slot shortcut */}
                    {availability.appointed.nextSlot && (
                      <button
                        type="button"
                        onClick={() => {
                          const d = new Date(availability.appointed!.nextSlot!);
                          setDate(d.toISOString().split("T")[0]);
                          setTime(d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false }));
                        }}
                        className="w-full text-sm text-brand-700 border border-brand-200 bg-brand-50 rounded-xl py-2.5 font-medium hover:bg-brand-100 transition-colors"
                      >
                        Use {availability.appointed.name}&apos;s next slot — {fmt(availability.appointed.nextSlot)}
                      </button>
                    )}

                    {/* Alternative technicians */}
                    {availability.alternatives.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2.5">
                          <Users className="w-3.5 h-3.5 text-gray-400" />
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            Available nearby for this time
                          </p>
                        </div>
                        <div className="space-y-2">
                          {availability.alternatives.map((tech) => (
                            <label
                              key={tech.id}
                              className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${
                                selectedTechId === tech.id
                                  ? "border-brand-500 bg-brand-50"
                                  : "border-gray-200 hover:border-gray-300"
                              }`}
                            >
                              <input
                                type="radio"
                                name="tech"
                                value={tech.id}
                                checked={selectedTechId === tech.id}
                                onChange={() => setSelectedTechId(tech.id)}
                                className="accent-brand-600"
                              />
                              <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-sm shrink-0">
                                {tech.name.charAt(0)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900">{tech.name}</p>
                                <p className="text-xs text-gray-500">{tech.qualification}</p>
                              </div>
                              <span className="text-xs text-gray-400 shrink-0">{tech.distanceMiles} mi</span>
                            </label>
                          ))}
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                          Note: {appointedTechName ?? "your usual technician"} remains your home&apos;s main technician.
                        </p>
                      </div>
                    )}

                    {availability.alternatives.length === 0 && !availability.appointed.nextSlot && (
                      <p className="text-sm text-gray-500 text-center py-2">
                        No technicians available for this date and time. Please choose a different slot.
                      </p>
                    )}
                  </div>
                )
              ) : null}
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          {/* Footer actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canConfirm || submitting}
              className="flex-1 bg-brand-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? "Saving…" : "Confirm reschedule"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
