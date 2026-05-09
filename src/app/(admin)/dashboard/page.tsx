import { prisma } from "@/lib/prisma";
import {
  Users, Home, Calendar, AlertCircle,
  PoundSterling, Clock, Zap, ClipboardList,
} from "lucide-react";

const TIER_PRICES: Record<string, number> = {
  BASIC: 15,
  STANDARD: 22,
  PLUS: 27,
  PREMIUM: 50,
  ENTERPRISE: 75,
};

const VISIT_TYPE_LABELS: Record<string, string> = {
  ROUTINE_PLUMBING: "Plumbing",
  ROUTINE_ELECTRICAL: "Electrical",
  ROUTINE_BOTH: "Plumbing & Electrical",
  EMERGENCY: "Emergency",
  BOILER_SERVICE: "Boiler Service",
};

async function getDashboardData() {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const [
    activeCustomers,
    properties,
    unsignedReports,
    visitsThisWeek,
    upcomingVisits,
    unassignedVisits,
    followUpVisits,
    emergencyVisits,
    tierBreakdown,
  ] = await Promise.all([
    prisma.customer.findMany({
      where: { subscriptionStatus: "ACTIVE" },
      select: { subscriptionTier: true },
    }),
    prisma.property.count(),
    prisma.visit.count({
      where: { status: "COMPLETED", report: { signedByTechnician: false } },
    }),
    prisma.visit.count({
      where: { scheduledAt: { gte: weekStart, lt: weekEnd } },
    }),
    prisma.visit.findMany({
      where: { status: "SCHEDULED", scheduledAt: { gte: now } },
      include: {
        property: {
          include: { customer: { include: { user: { select: { name: true } } } } },
        },
        technician: { include: { user: { select: { name: true } } } },
      },
      orderBy: { scheduledAt: "asc" },
      take: 8,
    }),
    prisma.visit.count({
      where: { status: "SCHEDULED", scheduledAt: { gte: now }, technicianId: null },
    }),
    prisma.visit.count({
      where: { status: "COMPLETED", report: { followUpRequired: true, signedByTechnician: false } },
    }),
    prisma.visit.count({
      where: { isEmergency: true, status: "SCHEDULED" },
    }),
    prisma.customer.groupBy({
      by: ["subscriptionTier"],
      where: { subscriptionStatus: "ACTIVE" },
      _count: true,
    }),
  ]);

  const mrr = activeCustomers.reduce(
    (sum, c) => sum + (TIER_PRICES[c.subscriptionTier] ?? 0),
    0
  );

  return {
    mrr,
    activeCount: activeCustomers.length,
    properties,
    unsignedReports,
    visitsThisWeek,
    upcomingVisits,
    unassignedVisits,
    followUpVisits,
    emergencyVisits,
    tierBreakdown,
  };
}

export default async function DashboardPage() {
  const d = await getDashboardData();

  const statCards = [
    {
      label: "Monthly revenue",
      value: `£${d.mrr.toLocaleString()}`,
      icon: PoundSterling,
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      label: "Active customers",
      value: d.activeCount,
      icon: Users,
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "Visits this week",
      value: d.visitsThisWeek,
      icon: Calendar,
      color: "text-purple-600 bg-purple-50",
    },
    {
      label: "Properties",
      value: d.properties,
      icon: Home,
      color: "text-sky-600 bg-sky-50",
    },
    {
      label: "Unsigned reports",
      value: d.unsignedReports,
      icon: ClipboardList,
      color: "text-amber-600 bg-amber-50",
    },
    {
      label: "Unassigned visits",
      value: d.unassignedVisits,
      icon: Clock,
      color: "text-orange-600 bg-orange-50",
    },
    {
      label: "Follow-ups needed",
      value: d.followUpVisits,
      icon: AlertCircle,
      color: "text-red-600 bg-red-50",
    },
    {
      label: "Emergency visits",
      value: d.emergencyVisits,
      icon: Zap,
      color: "text-rose-600 bg-rose-50",
    },
  ];

  const tierOrder = ["BASIC", "STANDARD", "PLUS", "PREMIUM", "ENTERPRISE"];
  const tierColors: Record<string, string> = {
    BASIC: "bg-gray-200",
    STANDARD: "bg-blue-300",
    PLUS: "bg-purple-400",
    PREMIUM: "bg-brand-500",
    ENTERPRISE: "bg-emerald-500",
  };
  const tierMap = Object.fromEntries(
    d.tierBreakdown.map((t) => [t.subscriptionTier, t._count])
  );
  const maxTierCount = Math.max(...Object.values(tierMap), 1);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4"
          >
            <div className={`p-3 rounded-xl shrink-0 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 leading-tight">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming visits table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Upcoming visits</h2>
            <a href="/visits" className="text-xs text-brand-600 hover:underline font-medium">
              View all
            </a>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 font-medium text-gray-500">Date</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Customer</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Type</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Technician</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {d.upcomingVisits.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-gray-400 text-sm">
                    No upcoming visits scheduled.
                  </td>
                </tr>
              ) : (
                d.upcomingVisits.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 text-gray-900 whitespace-nowrap">
                      {new Date(v.scheduledAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-gray-900 font-medium">
                        {v.property.customer.user.name ?? "—"}
                      </p>
                      <p className="text-gray-400 text-xs">{v.property.address}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          v.isEmergency
                            ? "bg-red-100 text-red-700"
                            : "bg-blue-50 text-blue-700"
                        }`}
                      >
                        {v.isEmergency ? "Emergency" : (VISIT_TYPE_LABELS[v.type] ?? v.type)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {v.technician ? (
                        v.technician.user.name
                      ) : (
                        <span className="text-orange-500 font-medium">Unassigned</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Subscription tier breakdown */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-5">Subscriptions by tier</h2>
          {d.activeCount === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No active customers.</p>
          ) : (
            <div className="space-y-4">
              {tierOrder.map((tier) => {
                const count = tierMap[tier] ?? 0;
                const pct = Math.round((count / d.activeCount) * 100);
                return (
                  <div key={tier}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-700 font-medium capitalize">
                        {tier.charAt(0) + tier.slice(1).toLowerCase()}
                      </span>
                      <span className="text-sm text-gray-500">
                        {count} · £{TIER_PRICES[tier]}/mo
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${tierColors[tier]}`}
                        style={{ width: `${(count / maxTierCount) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{pct}% of customers</p>
                  </div>
                );
              })}
              <div className="pt-3 border-t border-gray-100 flex justify-between text-sm">
                <span className="text-gray-500 font-medium">Total MRR</span>
                <span className="font-bold text-emerald-600">£{d.mrr.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
