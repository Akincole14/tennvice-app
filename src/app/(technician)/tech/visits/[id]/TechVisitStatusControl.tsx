"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlayCircle, Loader2 } from "lucide-react";

export default function TechVisitStatusControl({
  visitId,
  currentStatus,
}: {
  visitId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function startVisit() {
    setLoading(true);
    await fetch(`/api/visits/${visitId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "IN_PROGRESS" }),
    });
    setLoading(false);
    router.refresh();
  }

  if (currentStatus !== "SCHEDULED") return null;

  return (
    <button
      onClick={startVisit}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white font-semibold py-3 rounded-2xl hover:bg-brand-700 disabled:opacity-60 transition-colors"
    >
      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <PlayCircle className="w-5 h-5" />}
      Start visit
    </button>
  );
}
