import { prisma } from "@/lib/prisma";
import { ClipboardList } from "lucide-react";
import ManagerSignOutButton from "@/components/ManagerSignOutButton";
import VisitReportsClient, { MonthData } from "@/app/(owner)/owner/visit-reports/VisitReportsClient";

type Signal = "green" | "amber" | "red";

function completionSignal(rate: number): Signal {
  if (rate >= 80) return "green";
  if (rate >= 60) return "amber";
  return "red";
}

function cancellationSignal(rate: number): Signal {
  if (rate <= 10) return "green";
  if (rate <= 25) return "amber";
  return "red";
}

function revisitSignal(rate: number): Signal {
  if (rate <= 15) return "green";
  if (rate <= 30) return "amber";
  return "red";
}

async function getMonthlyData(): Promise<MonthData[]> {
  const now = new Date();
  const months: { label: string; shortLabel: string; start: Date; end: Date }[] = [];

  for (let i = 5; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end   = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    months.push({
      label:      start.toLocaleDateString("en-GB", { month: "long",  year: "numeric" }),
      shortLabel: start.toLocaleDateString("en-GB", { month: "short", year: "2-digit" }),
      start,
      end,
    });
  }

  return Promise.all(
    months.map(async ({ label, shortLabel, start, end }) => {
      const [total, completed, cancelled, revisits] = await Promise.all([
        prisma.visit.count({ where: { scheduledAt: { gte: start, lt: end } } }),
        prisma.visit.count({ where: { scheduledAt: { gte: start, lt: end }, status: "COMPLETED" } }),
        prisma.visit.count({ where: { scheduledAt: { gte: start, lt: end }, status: "CANCELLED" } }),
        prisma.visit.count({
          where: {
            scheduledAt: { gte: start, lt: end },
            status: "COMPLETED",
            report: { followUpRequired: true },
          },
        }),
      ]);

      const finished         = completed + cancelled;
      const completionRate   = finished  > 0 ? Math.round((completed / finished)  * 100) : 0;
      const cancellationRate = finished  > 0 ? Math.round((cancelled / finished)  * 100) : 0;
      const revisitRate      = completed > 0 ? Math.round((revisits  / completed) * 100) : 0;

      return {
        label,
        shortLabel,
        total,
        completed,
        cancelled,
        revisits,
        completionRate,
        cancellationRate,
        revisitRate,
        completionSignal:   completionSignal(completionRate),
        cancellationSignal: cancellationSignal(cancellationRate),
        revisitSignal:      revisitSignal(revisitRate),
      };
    })
  );
}

const signalDotClass: Record<Signal, string> = {
  green: "bg-green-500",
  amber: "bg-amber-400",
  red:   "bg-red-500",
};
const signalLabel: Record<Signal, string> = {
  green: "Good",
  amber: "Warning",
  red:   "Alert",
};

export default async function ManagerVisitReportsPage() {
  const months  = await getMonthlyData();
  const current = months[months.length - 1];

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-4 md:py-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-brand-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Visit Reports</h1>
            <p className="text-sm text-gray-500 mt-0.5">Monthly performance across all visits</p>
          </div>
        </div>
        <ManagerSignOutButton />
      </div>

      <div className="flex items-center gap-5 text-xs text-gray-500">
        {(["green", "amber", "red"] as Signal[]).map(s => (
          <div key={s} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${signalDotClass[s]}`} />
            <span className="font-medium">{signalLabel[s]}</span>
          </div>
        ))}
      </div>

      <VisitReportsClient months={months} current={current} />
    </div>
  );
}
