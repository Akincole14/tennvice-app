"use client";

import { useState } from "react";
import { CheckCircle, Loader2, X } from "lucide-react";

export default function QuoteSentButton({
  customerId,
  quoteSentAt,
}: {
  customerId: string;
  quoteSentAt: Date | null;
}) {
  const [sentAt, setSentAt] = useState<Date | null>(quoteSentAt);
  const [loading, setLoading] = useState(false);

  async function toggle(clear: boolean) {
    setLoading(true);
    const res = await fetch(`/api/customers/${customerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clear }),
    });
    if (res.ok) {
      const data = await res.json();
      setSentAt(data.landlordQuoteSentAt ? new Date(data.landlordQuoteSentAt) : null);
    }
    setLoading(false);
  }

  if (sentAt) {
    return (
      <button
        onClick={() => toggle(true)}
        disabled={loading}
        title="Undo — mark as not sent"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-green-100 text-green-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 border border-green-200 transition-colors disabled:opacity-50 whitespace-nowrap group"
      >
        {loading
          ? <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
          : <>
              <CheckCircle className="w-3.5 h-3.5 shrink-0 group-hover:hidden" />
              <X className="w-3.5 h-3.5 shrink-0 hidden group-hover:block" />
            </>}
        <span className="group-hover:hidden">
          Quote sent {new Date(sentAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
        </span>
        <span className="hidden group-hover:inline">Undo</span>
      </button>
    );
  }

  return (
    <button
      onClick={() => toggle(false)}
      disabled={loading}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-green-300 text-green-700 hover:bg-green-50 transition-colors disabled:opacity-50 whitespace-nowrap"
    >
      {loading
        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
        : <CheckCircle className="w-3.5 h-3.5" />}
      Quote sent
    </button>
  );
}
