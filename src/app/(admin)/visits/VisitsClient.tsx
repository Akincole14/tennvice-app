"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import ScheduleVisitModal from "@/components/admin/ScheduleVisitModal";

type Property = { id: string; address: string; postcode: string; customer: { user: { name: string | null } } };
type Technician = { id: string; user: { name: string | null } };

export default function VisitsClient({
  properties,
  technicians,
}: {
  properties: Property[];
  technicians: Technician[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-brand-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-brand-700"
      >
        <Plus className="w-4 h-4" />
        Schedule visit
      </button>
      {open && (
        <ScheduleVisitModal
          properties={properties}
          technicians={technicians}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
