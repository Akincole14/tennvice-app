"use client";

import { useState } from "react";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { LayoutList, BarChart2 } from "lucide-react";

type Signal = "green" | "amber" | "red";

const signalStyles: Record<Signal, { dot: string; badge: string; text: string; label: string }> = {
  green: { dot: "bg-green-500",  badge: "bg-green-50 border-green-200",  text: "text-green-700",  label: "Good"    },
  amber: { dot: "bg-amber-400",  badge: "bg-amber-50 border-amber-200",  text: "text-amber-700",  label: "Warning" },
  red:   { dot: "bg-red-500",    badge: "bg-red-50 border-red-200",      text: "text-red-700",    label: "Alert"   },
};

export type MonthData = {
  label: string;
  shortLabel: string;
  total: number;
  completed: number;
  cancelled: number;
  revisits: number;
  completionRate: number;
  cancellationRate: number;
  revisitRate: number;
  completionSignal: Signal;
  cancellationSignal: Signal;
  revisitSignal: Signal;
};

function SignalBadge({ signal, value }: { signal: Signal; value: number }) {
  const s = signalStyles[signal];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${s.badge} ${s.text}`}>
      <span className={`w-2 h-2 rounded-full ${s.dot}`} />
      {value}% — {s.label}
    </span>
  );
}

function TableView({ months }: { months: MonthData[] }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900">6-Month Breakdown</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {["Month", "Total", "Completed", "Cancelled", "Revisits", "Completion", "Cancellation", "Revisit rate"].map(h => (
                <th key={h} className="text-left px-6 py-3 font-medium text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {months.map((m, i) => (
              <tr key={m.label} className={i === months.length - 1 ? "bg-brand-50/40" : "hover:bg-gray-50 transition-colors"}>
                <td className="px-6 py-3 font-medium text-gray-900 whitespace-nowrap">
                  {m.label}
                  {i === months.length - 1 && (
                    <span className="ml-2 text-[10px] font-bold text-brand-600 uppercase tracking-wide bg-brand-100 px-1.5 py-0.5 rounded">Now</span>
                  )}
                </td>
                <td className="px-6 py-3 text-gray-700 font-medium">{m.total}</td>
                <td className="px-6 py-3">
                  <span className="flex items-center gap-1.5 text-green-700 font-medium">
                    <span className="w-2 h-2 rounded-full bg-green-500" />{m.completed}
                  </span>
                </td>
                <td className="px-6 py-3">
                  <span className="flex items-center gap-1.5 text-red-600 font-medium">
                    <span className="w-2 h-2 rounded-full bg-red-500" />{m.cancelled}
                  </span>
                </td>
                <td className="px-6 py-3">
                  <span className="flex items-center gap-1.5 text-amber-600 font-medium">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />{m.revisits}
                  </span>
                </td>
                <td className="px-6 py-3"><SignalBadge signal={m.completionSignal}   value={m.completionRate}   /></td>
                <td className="px-6 py-3"><SignalBadge signal={m.cancellationSignal} value={m.cancellationRate} /></td>
                <td className="px-6 py-3"><SignalBadge signal={m.revisitSignal}      value={m.revisitRate}      /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-3 border-t border-gray-100 text-xs text-gray-400">
        Completion ≥80% green · 60–79% amber · &lt;60% red &nbsp;|&nbsp;
        Cancellation ≤10% green · 11–25% amber · &gt;25% red &nbsp;|&nbsp;
        Revisit ≤15% green · 16–30% amber · &gt;30% red
      </div>
    </div>
  );
}

function GraphView({ months }: { months: MonthData[] }) {
  const barData = months.map(m => ({
    month:     m.shortLabel,
    Completed: m.completed,
    Cancelled: m.cancelled,
    Revisits:  m.revisits,
  }));

  const lineData = months.map(m => ({
    month:            m.shortLabel,
    "Completion %":   m.completionRate,
    "Cancellation %": m.cancellationRate,
    "Revisit %":      m.revisitRate,
  }));

  return (
    <div className="space-y-6">
      {/* Bar chart — visit counts */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-1">Visit counts by month</h2>
        <p className="text-xs text-gray-400 mb-6">Completed, cancelled and revisits per month</p>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={barData} barCategoryGap="30%" barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12 }}
              cursor={{ fill: "#f9fafb" }}
            />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 16 }} />
            <Bar dataKey="Completed" fill="#22c55e" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Cancelled" fill="#ef4444" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Revisits"  fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Line chart — rates with signal reference lines */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-1">Rate trends</h2>
        <p className="text-xs text-gray-400 mb-6">Dashed lines show amber/red thresholds</p>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={lineData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 12, fill: "#6b7280" }}
              axisLine={false}
              tickLine={false}
              unit="%"
              domain={[0, 100]}
            />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12 }}
              formatter={(v: number) => [`${v}%`]}
            />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 16 }} />

            {/* Completion thresholds — want HIGH */}
            <ReferenceLine y={80} stroke="#22c55e" strokeDasharray="4 3" strokeWidth={1.5} label={{ value: "80% (good)", position: "insideTopRight", fontSize: 10, fill: "#22c55e" }} />
            <ReferenceLine y={60} stroke="#f59e0b" strokeDasharray="4 3" strokeWidth={1.5} label={{ value: "60% (warn)", position: "insideTopRight", fontSize: 10, fill: "#f59e0b" }} />

            <Line dataKey="Completion %"   stroke="#22c55e" strokeWidth={2.5} dot={{ r: 4, fill: "#22c55e" }}  activeDot={{ r: 6 }} />
            <Line dataKey="Cancellation %" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4, fill: "#ef4444" }}  activeDot={{ r: 6 }} />
            <Line dataKey="Revisit %"      stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4, fill: "#f59e0b" }}  activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function VisitReportsClient({ months, current }: { months: MonthData[]; current: MonthData }) {
  const [view, setView] = useState<"table" | "graph">("table");

  return (
    <div className="space-y-6">
      {/* Current month summary */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">{current.label} — This month</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total visits",       value: current.total,            suffix: "",  signal: null as Signal | null },
            { label: "Completion rate",    value: current.completionRate,   suffix: "%", signal: current.completionSignal   },
            { label: "Cancellation rate",  value: current.cancellationRate, suffix: "%", signal: current.cancellationSignal },
            { label: "Revisit rate",       value: current.revisitRate,      suffix: "%", signal: current.revisitSignal      },
          ].map(({ label, value, suffix, signal }) => {
            const s = signal ? signalStyles[signal] : null;
            return (
              <div key={label} className={`rounded-xl border p-4 ${s ? s.badge : "border-gray-200 bg-gray-50"}`}>
                <div className="flex items-center gap-2 mb-1">
                  {signal && <span className={`w-2.5 h-2.5 rounded-full ${s!.dot} shrink-0`} />}
                  <p className={`text-2xl font-bold ${s ? s.text : "text-gray-900"}`}>{value}{suffix}</p>
                </div>
                <p className={`text-xs font-medium ${s ? s.text : "text-gray-500"}`}>{label}</p>
                {signal && <p className={`text-xs mt-1 ${s!.text} opacity-70`}>{s!.label}</p>}
              </div>
            );
          })}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Completed</span>
            <span className="font-semibold text-green-700">{current.completed}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Cancelled</span>
            <span className="font-semibold text-red-600">{current.cancelled}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Revisits needed</span>
            <span className="font-semibold text-amber-600">{current.revisits}</span>
          </div>
        </div>
      </div>

      {/* View toggle */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">6-Month Breakdown</h2>
        <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-1">
          <button
            onClick={() => setView("table")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              view === "table" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <LayoutList className="w-4 h-4" />
            Table
          </button>
          <button
            onClick={() => setView("graph")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              view === "graph" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            Graph
          </button>
        </div>
      </div>

      {view === "table" ? <TableView months={months} /> : <GraphView months={months} />}
    </div>
  );
}
