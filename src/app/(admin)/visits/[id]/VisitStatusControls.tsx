"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const TRANSITIONS: Record<string, { label: string; next: string; style: string }[]> = {
  SCHEDULED: [
    { label: "Mark in progress", next: "IN_PROGRESS", style: "bg-yellow-500 hover:bg-yellow-600 text-white" },
    { label: "Cancel visit",     next: "CANCELLED",   style: "border border-red-300 text-red-600 hover:bg-red-50" },
  ],
  IN_PROGRESS: [
    { label: "Mark completed", next: "COMPLETED", style: "bg-green-600 hover:bg-green-700 text-white" },
    { label: "Cancel visit",   next: "CANCELLED",  style: "border border-red-300 text-red-600 hover:bg-red-50" },
  ],
  COMPLETED: [],
  CANCELLED: [
    { label: "Reschedule (mark scheduled)", next: "SCHEDULED", style: "border border-gray-300 text-gray-700 hover:bg-gray-50" },
  ],
};

export default function VisitStatusControls({
  visitId,
  currentStatus,
}: {
  visitId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const actions = TRANSITIONS[currentStatus] ?? [];
  if (actions.length === 0) return null;

  async function updateStatus(next: string) {
    setLoading(true);
    setError("");

    const res = await fetch(`/api/visits/${visitId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to update status");
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {actions.map((action) => (
        <button
          key={action.next}
          onClick={() => updateStatus(action.next)}
          disabled={loading}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 ${action.style}`}
        >
          {loading ? "Updating…" : action.label}
        </button>
      ))}
    </div>
  );
}
