"use client";

import { useState } from "react";
import { CalendarClock } from "lucide-react";
import dynamic from "next/dynamic";

const RescheduleModal = dynamic(() => import("./RescheduleModal"), { ssr: false });

interface Props {
  visitId: string;
  scheduledAt: string;
  technicianName: string | null;
  propertyAddress: string;
}

export default function RescheduleButton({ visitId, scheduledAt, technicianName, propertyAddress }: Props) {
  const [open, setOpen] = useState(false);
  const [updated, setUpdated] = useState<{ date: string; techName: string | null } | null>(null);

  function handleSuccess(newDate: string, techName: string | null) {
    setUpdated({ date: newDate, techName });
    setOpen(false);
  }

  return (
    <>
      {updated ? (
        <div className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
          Rescheduled to{" "}
          {new Date(updated.date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
          {" at "}
          {new Date(updated.date).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
          {updated.techName ? ` · ${updated.techName}` : ""}
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 text-sm font-medium text-brand-600 border border-brand-200 bg-brand-50 px-4 py-2 rounded-xl hover:bg-brand-100 transition-colors"
        >
          <CalendarClock className="w-4 h-4" />
          Reschedule
        </button>
      )}

      {open && (
        <RescheduleModal
          visitId={visitId}
          currentScheduledAt={scheduledAt}
          appointedTechName={technicianName}
          propertyAddress={propertyAddress}
          onClose={() => setOpen(false)}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
}
