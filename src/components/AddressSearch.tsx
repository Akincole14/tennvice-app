"use client";

import { useState } from "react";

type Fields = {
  line1: string;
  line2: string;
  town: string;
  county: string;
  postcode: string;
};

function combine(f: Fields): string {
  return [f.line1, f.line2, f.town, f.county, f.postcode]
    .map(s => s.trim())
    .filter(Boolean)
    .join(", ");
}

function parse(value: string): Fields {
  const empty: Fields = { line1: "", line2: "", town: "", county: "", postcode: "" };
  if (!value) return empty;

  const parts = value.split(", ").map(s => s.trim()).filter(Boolean);
  const isPostcode = (s: string) => /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i.test(s);

  if (parts.length === 0) return empty;

  const f = { ...empty };
  if (isPostcode(parts[parts.length - 1])) {
    f.postcode = parts.pop()!;
  }
  if (parts.length >= 1) f.line1 = parts[0];
  if (parts.length === 2) f.town = parts[1];
  if (parts.length === 3) { f.line2 = parts[1]; f.town = parts[2]; }
  if (parts.length >= 4) { f.line2 = parts[1]; f.town = parts[2]; f.county = parts[3]; }
  return f;
}

const input = "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500";
const label = "block text-xs font-medium text-gray-600 mb-1";
const req   = <span className="text-red-400 ml-0.5">*</span>;

export default function AddressSearch({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [f, setF] = useState<Fields>(() => parse(value));

  function set(key: keyof Fields, val: string) {
    const next = { ...f, [key]: val };
    setF(next);
    onChange(combine(next));
  }

  return (
    <div className="space-y-3">
      <div>
        <label className={label}>Address line 1{req}</label>
        <input
          type="text"
          value={f.line1}
          onChange={e => set("line1", e.target.value)}
          placeholder="House number and street name"
          className={input}
        />
      </div>

      <div>
        <label className={label}>Address line 2 <span className="text-gray-400 font-normal">(optional)</span></label>
        <input
          type="text"
          value={f.line2}
          onChange={e => set("line2", e.target.value)}
          placeholder="Apartment, flat, building name, etc."
          className={input}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label}>Town / City{req}</label>
          <input
            type="text"
            value={f.town}
            onChange={e => set("town", e.target.value)}
            placeholder="e.g. Birmingham"
            className={input}
          />
        </div>
        <div>
          <label className={label}>County <span className="text-gray-400 font-normal">(optional)</span></label>
          <input
            type="text"
            value={f.county}
            onChange={e => set("county", e.target.value)}
            placeholder="e.g. West Midlands"
            className={input}
          />
        </div>
      </div>

      <div>
        <label className={label}>Postcode{req}</label>
        <input
          type="text"
          value={f.postcode}
          onChange={e => set("postcode", e.target.value.toUpperCase())}
          placeholder="e.g. B1 2AB"
          maxLength={8}
          className={`${input} uppercase tracking-wider`}
          style={{ maxWidth: 160 }}
        />
      </div>
    </div>
  );
}
