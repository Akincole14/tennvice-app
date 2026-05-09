"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type CheckResult = "PASS" | "ADVISORY" | "FAIL" | "NOT_CHECKED";

const RESULTS: { value: CheckResult; label: string; color: string }[] = [
  { value: "PASS",        label: "Pass",        color: "text-green-600" },
  { value: "ADVISORY",    label: "Advisory",    color: "text-amber-600" },
  { value: "FAIL",        label: "Fail",        color: "text-red-600" },
  { value: "NOT_CHECKED", label: "Not checked", color: "text-gray-400" },
];

function CheckRow({
  label,
  field,
  value,
  notes,
  onChange,
}: {
  label: string;
  field: string;
  value: CheckResult;
  notes: string;
  onChange: (field: string, val: string) => void;
}) {
  return (
    <div className="grid grid-cols-12 gap-3 items-start py-3 border-b border-gray-100 last:border-0">
      <div className="col-span-3 text-sm font-medium text-gray-700 pt-1">{label}</div>
      <div className="col-span-4 flex gap-2 flex-wrap">
        {RESULTS.map((r) => (
          <label key={r.value} className={`flex items-center gap-1 text-xs cursor-pointer ${r.color}`}>
            <input
              type="radio"
              name={field}
              value={r.value}
              checked={value === r.value}
              onChange={() => onChange(field, r.value)}
              className="accent-current"
            />
            {r.label}
          </label>
        ))}
      </div>
      <div className="col-span-5">
        <input
          type="text"
          placeholder="Notes…"
          value={notes}
          onChange={(e) => onChange(`${field}Notes`, e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>
    </div>
  );
}

export default function ReportForm({ visitId }: { visitId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState<Record<string, string | boolean>>({
    pipesCheck: "NOT_CHECKED",        pipesNotes: "",
    heatingCheck: "NOT_CHECKED",      heatingNotes: "",
    waterPumpCheck: "NOT_CHECKED",    waterPumpNotes: "",
    cylinderCheck: "NOT_CHECKED",     cylinderNotes: "",
    pressureCheck: "NOT_CHECKED",     pressureNotes: "",
    leakageCheck: "NOT_CHECKED",      leakageNotes: "",
    electricalCheck: "NOT_CHECKED",   electricalNotes: "",
    boilerCheck: "NOT_CHECKED",       boilerNotes: "",
    usageAdviceGiven: false,
    boilerServiced: false,
    systemFlushed: false,
    cylinderFlushed: false,
    overallNotes: "",
    recommendations: "",
    partsRequired: "",
    followUpRequired: false,
    signedByTechnician: false,
  });

  function set(field: string, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function submit(sign: boolean) {
    setLoading(true);
    setError("");

    const payload = { ...form, signedByTechnician: sign };

    const res = await fetch(`/api/visits/${visitId}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Something went wrong");
      return;
    }

    setSaved(true);
    if (sign) {
      router.push("/visits");
      router.refresh();
    }
  }

  const checks: { label: string; field: string }[] = [
    { label: "Pipes",        field: "pipesCheck" },
    { label: "Heating",      field: "heatingCheck" },
    { label: "Water pump",   field: "waterPumpCheck" },
    { label: "Cylinder",     field: "cylinderCheck" },
    { label: "Pressure",     field: "pressureCheck" },
    { label: "Leakage",      field: "leakageCheck" },
    { label: "Electrical",   field: "electricalCheck" },
    { label: "Boiler",       field: "boilerCheck" },
  ];

  return (
    <div className="max-w-3xl space-y-8">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>
      )}
      {saved && !form.signedByTechnician && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2">Draft saved.</p>
      )}

      {/* Checks */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Inspection checks</h2>
        {checks.map((c) => (
          <CheckRow
            key={c.field}
            label={c.label}
            field={c.field}
            value={form[c.field] as CheckResult}
            notes={form[`${c.field}Notes`] as string}
            onChange={set}
          />
        ))}
      </div>

      {/* Additional services */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Services performed</h2>
        <div className="space-y-3">
          {[
            { field: "usageAdviceGiven", label: "Usage advice given" },
            { field: "boilerServiced",   label: "Boiler serviced" },
            { field: "systemFlushed",    label: "System flushed" },
            { field: "cylinderFlushed",  label: "Cylinder flushed" },
            { field: "followUpRequired", label: "Follow-up visit required" },
          ].map(({ field, label }) => (
            <label key={field} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={form[field] as boolean}
                onChange={(e) => set(field, e.target.checked)}
                className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Notes & recommendations</h2>
        {[
          { field: "overallNotes",    label: "Overall notes" },
          { field: "recommendations", label: "Recommendations" },
          { field: "partsRequired",   label: "Parts required" },
        ].map(({ field, label }) => (
          <div key={field}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <textarea
              rows={3}
              value={form[field] as string}
              onChange={(e) => set(field, e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => submit(false)}
          disabled={loading}
          className="px-5 py-2 border border-gray-300 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          Save draft
        </button>
        <button
          type="button"
          onClick={() => submit(true)}
          disabled={loading}
          className="px-5 py-2 bg-brand-600 text-white text-sm font-semibold rounded-lg hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? "Saving…" : "Sign & complete visit"}
        </button>
      </div>
    </div>
  );
}
