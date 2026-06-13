"use client";

import { useState } from "react";
import { CheckCircle, Loader2 } from "lucide-react";

export default function QuoteSentButton({
  customerId,
  quoteSentAt,
}: {
  customerId: string;
  quoteSentAt: Date | null;
}) {
  const [sentAt, setSentAt] = useState<Date | null>(quoteSentAt);
  const [loading, setLoading] = useState(false);

  if (sentAt) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-green-100 text-green-700 whitespace-nowrap">
        <CheckCircle className="w-3.5 h-3.5 shrink-0" />
        Quote sent {new Date(sentAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
      </span>
    );
  }

  async function handleClick() {
    setLoading(true);
    const res = await fetch(`/api/customers/${customerId}`, { method: "PATCH" });
    if (res.ok) {
      const data = await res.json();
      setSentAt(new Date(data.landlordQuoteSentAt));
    }
    setLoading(false);
  }

  return (
    <button
      onClick={handleClick}
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
