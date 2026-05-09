"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import EditVisitModal from "@/components/admin/EditVisitModal";

type Technician = { id: string; user: { name: string | null } };

export default function VisitActions({
  visitId,
  type,
  scheduledAt,
  technicianId,
  technicians,
}: {
  visitId: string;
  type: string;
  scheduledAt: Date;
  technicianId: string | null;
  technicians: Technician[];
}) {
  const [editing, setEditing] = useState(false);

  return (
    <>
      <button
        onClick={() => setEditing(true)}
        className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <Pencil className="w-3.5 h-3.5" />
        Edit visit
      </button>
      {editing && (
        <EditVisitModal
          visitId={visitId}
          initialType={type}
          initialScheduledAt={scheduledAt}
          initialTechnicianId={technicianId}
          technicians={technicians}
          onClose={() => setEditing(false)}
        />
      )}
    </>
  );
}
