"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
  propertyId: string;
  remaining: number;
}

export default function AdminAiScheduleButton({ propertyId, remaining }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    message: string;
    visits: { date: string; type: string }[];
    technicianName?: string | null;
    assignmentReason?: string | null;
  } | null>(null);
  const [error, setError] = useState("");

  if (remaining <= 0) return null;

  async function handleSchedule() {
    setLoading(true);
    setError("");
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 55000);
      const res = await fetch("/api/admin/visits/ai-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      let data: any = {};
      try { data = await res.json(); } catch { /* non-JSON */ }
      if (!res.ok) {
        setError(data.error ?? "Scheduling failed.");
      } else {
        setResult(data);
        router.refresh();
      }
    } catch (err: any) {
      setError(err?.name === "AbortError" ? "Request timed out. Please try again." : "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      {result ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 space-y-1">
          <p className="text-xs font-semibold text-green-800">{result.message}</p>
          {result.visits.length > 0 && (
            <ul className="space-y-0.5">
              {result.visits.map((v, i) => (
                <li key={i} className="text-xs text-green-700">
                  {new Date(v.date).toLocaleDateString("en-GB", {
                    weekday: "short", day: "numeric", month: "short", year: "numeric",
                  })}
                </li>
              ))}
            </ul>
          )}
          {result.technicianName && (
            <p className="text-xs text-green-600 pt-0.5">
              Assigned: <span className="font-medium">{result.technicianName}</span>
              {result.assignmentReason ? ` — ${result.assignmentReason}` : ""}
            </p>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-gray-400">
            {remaining} visit{remaining !== 1 ? "s" : ""} remaining this year
          </p>
          <button
            onClick={handleSchedule}
            disabled={loading}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-purple-700 border border-purple-200 bg-purple-50 px-3 py-1.5 rounded-lg hover:bg-purple-100 transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {loading
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <Sparkles className="w-3.5 h-3.5" />}
            {loading ? "Scheduling…" : "AI Schedule remaining"}
          </button>
        </div>
      )}
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
  );
}
