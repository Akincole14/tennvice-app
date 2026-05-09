"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

type CheckResult = "PASS" | "ADVISORY" | "FAIL" | "NOT_CHECKED";

const RESULTS: { value: CheckResult; label: string; dot: string }[] = [
  { value: "PASS",        label: "Pass",        dot: "bg-green-500" },
  { value: "ADVISORY",    label: "Advisory",    dot: "bg-amber-500" },
  { value: "FAIL",        label: "Fail",        dot: "bg-red-500" },
  { value: "NOT_CHECKED", label: "N/A",         dot: "bg-gray-300" },
];

const CHECKS: { label: string; field: string; group: string }[] = [
  { label: "Pipes",        field: "pipesCheck",       group: "Plumbing" },
  { label: "Heating",      field: "heatingCheck",     group: "Plumbing" },
  { label: "Water pump",   field: "waterPumpCheck",   group: "Plumbing" },
  { label: "Cylinder",     field: "cylinderCheck",    group: "Plumbing" },
  { label: "Pressure",     field: "pressureCheck",    group: "Plumbing" },
  { label: "Leakage",      field: "leakageCheck",     group: "Plumbing" },
  { label: "Electrical",   field: "electricalCheck",  group: "Electrical" },
  { label: "Boiler",       field: "boilerCheck",      group: "Boiler" },
];

type ExistingReport = Record<string, string | boolean | Date | null | undefined> | null;

function initForm(existing: ExistingReport): Record<string, string | boolean> {
  const defaults: Record<string, string | boolean> = {
    pipesCheck: "NOT_CHECKED",     pipesNotes: "",
    heatingCheck: "NOT_CHECKED",   heatingNotes: "",
    waterPumpCheck: "NOT_CHECKED", waterPumpNotes: "",
    cylinderCheck: "NOT_CHECKED",  cylinderNotes: "",
    pressureCheck: "NOT_CHECKED",  pressureNotes: "",
    leakageCheck: "NOT_CHECKED",   leakageNotes: "",
    electricalCheck: "NOT_CHECKED",electricalNotes: "",
    boilerCheck: "NOT_CHECKED",    boilerNotes: "",
    usageAdviceGiven: false, boilerServiced: false,
    systemFlushed: false,    cylinderFlushed: false,
    overallNotes: "", recommendations: "", partsRequired: "",
    followUpRequired: false,
  };
  if (!existing) return defaults;
  const merged: Record<string, string | boolean> = { ...defaults };
  for (const key of Object.keys(defaults)) {
    const val = existing[key];
    if (val !== undefined && val !== null && !(val instanceof Date)) {
      merged[key] = val as string | boolean;
    }
  }
  return merged;
}

function CheckRow({ label, field, value, notes, onChange }: {
  label: string; field: string; value: CheckResult; notes: string;
  onChange: (field: string, val: string) => void;
}) {
  return (
    <div className="py-3 border-b border-gray-100 last:border-0">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-800">{label}</span>
        <div className="flex gap-1">
          {RESULTS.map(r => (
            <button
              key={r.value}
              type="button"
              onClick={() => onChange(field, r.value)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                value === r.value
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${r.dot}`} />
              {r.label}
            </button>
          ))}
        </div>
      </div>
      {value !== "NOT_CHECKED" && (
        <input
          type="text"
          placeholder={`Notes for ${label.toLowerCase()}…`}
          value={notes}
          onChange={e => onChange(`${field}Notes`, e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-gray-700 placeholder:text-gray-300"
        />
      )}
    </div>
  );
}

export default function TechReportForm({
  visitId,
  existingReport,
}: {
  visitId: string;
  existingReport: ExistingReport;
}) {
  const router = useRouter();
  const [form, setForm] = useState(() => initForm(existingReport));
  const [loading, setLoading] = useState<"draft" | "sign" | null>(null);
  const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function set(field: string, value: string | boolean) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function submit(sign: boolean) {
    setLoading(sign ? "sign" : "draft");
    setStatus(null);
    const res = await fetch(`/api/visits/${visitId}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, signedByTechnician: sign }),
    });
    setLoading(null);
    if (!res.ok) {
      const d = await res.json();
      setStatus({ type: "error", text: d.error ?? "Something went wrong" });
      return;
    }
    if (sign) {
      router.push("/tech/visits");
      router.refresh();
    } else {
      setStatus({ type: "success", text: "Draft saved." });
    }
  }

  const groups = ["Plumbing", "Electrical", "Boiler"];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Inspection report</h2>
        {existingReport && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">Draft saved</span>
        )}
      </div>

      {/* Checks grouped by category */}
      {groups.map(group => {
        const groupChecks = CHECKS.filter(c => c.group === group);
        return (
          <div key={group} className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{group}</p>
            {groupChecks.map(c => (
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
        );
      })}

      {/* Services performed */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Services performed</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { field: "boilerServiced",   label: "Boiler serviced" },
            { field: "systemFlushed",    label: "System flushed" },
            { field: "cylinderFlushed",  label: "Cylinder flushed" },
            { field: "usageAdviceGiven", label: "Usage advice given" },
          ].map(({ field, label }) => (
            <label key={field} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer p-2 rounded-lg hover:bg-gray-50">
              <input
                type="checkbox"
                checked={form[field] as boolean}
                onChange={e => set(field, e.target.checked)}
                className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Notes & recommendations</p>
        {[
          { field: "overallNotes",    label: "Overall notes",    placeholder: "General observations from the visit…" },
          { field: "recommendations", label: "Recommendations",  placeholder: "Work or repairs recommended…" },
          { field: "partsRequired",   label: "Parts required",   placeholder: "Any parts or materials needed…" },
        ].map(({ field, label, placeholder }) => (
          <div key={field}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <textarea
              rows={2}
              value={form[field] as string}
              onChange={e => set(field, e.target.value)}
              placeholder={placeholder}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none placeholder:text-gray-300"
            />
          </div>
        ))}
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={form.followUpRequired as boolean}
            onChange={e => set("followUpRequired", e.target.checked)}
            className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
          />
          Flag for follow-up visit
        </label>
      </div>

      {status && (
        <div className={`flex items-center gap-2 text-sm rounded-xl px-4 py-3 ${
          status.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
        }`}>
          {status.type === "success"
            ? <CheckCircle className="w-4 h-4 shrink-0" />
            : <AlertCircle className="w-4 h-4 shrink-0" />}
          {status.text}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => submit(false)}
          disabled={loading !== null}
          className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 text-sm font-medium text-gray-700 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          {loading === "draft" && <Loader2 className="w-4 h-4 animate-spin" />}
          Save draft
        </button>
        <button
          onClick={() => submit(true)}
          disabled={loading !== null}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 disabled:opacity-60 transition-colors"
        >
          {loading === "sign" && <Loader2 className="w-4 h-4 animate-spin" />}
          Sign & complete visit
        </button>
      </div>
    </div>
  );
}
