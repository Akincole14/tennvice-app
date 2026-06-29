"use client";

import { useState } from "react";
import { CalendarPlus, Sparkles } from "lucide-react";
import dynamic from "next/dynamic";

const BookVisitModal = dynamic(() => import("./BookVisitModal"), { ssr: false });

interface Property {
  id: string;
  address: string;
}

interface BookingActionsProps {
  properties: Property[];
}

export default function BookingActions({ properties }: BookingActionsProps) {
  const [open, setOpen] = useState(false);
  const [initialTab, setInitialTab] = useState<"manual" | "ai">("manual");

  function openModal(tab: "manual" | "ai") {
    setInitialTab(tab);
    setOpen(true);
  }

  function handleSuccess() {
    setOpen(false);
    window.location.reload();
  }

  if (properties.length === 0) return null;

  return (
    <>
      <div className="flex gap-3">
        <button
          onClick={() => openModal("manual")}
          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-brand-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          <CalendarPlus className="w-4 h-4" />
          Book a visit
        </button>
        <button
          onClick={() => openModal("ai")}
          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 border border-brand-300 text-brand-700 bg-brand-50 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-brand-100 transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          Auto-schedule
        </button>
      </div>

      {open && (
        <BookVisitModal
          properties={properties}
          onClose={() => setOpen(false)}
          onSuccess={handleSuccess}
          initialTab={initialTab}
        />
      )}
    </>
  );
}
