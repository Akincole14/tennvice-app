import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  Users, Home, Calendar, AlertCircle,
  PoundSterling, Clock, Zap, ClipboardList,
} from "lucide-react";

const TIER_PRICES: Record<string, number> = {
  BASIC: 15, STANDARD: 22, PLUS: 27, PREMIUM: 50, ENTERPRISE: 75,
};

const VISIT_TYPE_LABELS: Record<string, string> = {
  ROUTINE_PLUMBING:   "Plumbing",
  ROUTINE_ELECTRICAL: "Electrical",
  ROUTINE_BOTH:       "Plumbing & Electrical",
  EMERGENCY:          "Emergency",
  BOILER_SERVICE:     "Boiler Service",
};

const typeColors: Record<string, string> = {
  ROUTINE_PLUMBING:   "bg-sky-50 text-sky-700",
  ROUTINE_ELECTRICAL: "bg-violet-50 text-violet-700",
  ROUTINE_BOTH:       "bg-indigo-50 text-indigo-700",
  BOILER_SERVICE:     "bg-orange-50 text-orange-700",
  EMERGENCY:          "bg-red-100 text-red-700",
};

async function getDashboardData() {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const visitInclude = {
    property: {
      include: { customer: { include: { user: { select: { name: true } } } } },
    },
    technician: { include: { user: { select: { name: true } } } },
  } as const;

  const [
    activeCustomers,
    propertyCount,
    visitsThisWeek,
    upcomingVisits,
    unassignedVisits,
    unsignedReports,
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
      where: { scheduledAt: { gte: weekStart, lt: weekEnd } },
    }),
    prisma.visit.findMany({
      where: { status: "SCHEDULED", scheduledAt: { gte: now } },
      include: visitInclude,
      orderBy: { scheduledAt: "asc" },
      take: 8,
    }),
    prisma.visit.findMany({
      where: { status: "SCHEDULED", scheduledAt: { gte: now }, technicianId: null },
      include: visitInclude,
      orderBy: { scheduledAt: "asc" },
      take: 5,
    }),
    prisma.visit.findMany({
      where: { status: "COMPLETED", report: { signedByTechnician: false } },
      include: visitInclude,
      orderBy: { scheduledAt: "desc" },
      take: 5,
    }),
    prisma.visit.findMany({
      where: { status: "COMPLETED", report: { followUpRequired: true, signedByTechnician: false } },
      include: visitInclude,
      orderBy: { scheduledAt: "desc" },
      take: 5,
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
    propertyCount,
    visitsThisWeek,
    upcomingVisits,
    unassignedVisits,
    unsignedReports,
    followUpVisits,
    emergencyVisits,
    tierBreakdown,
  };
}

export default async function DashboardPage() {
  const d = await getDashboardData();

  const statCards = [
    { label: "Monthly revenue",   value: `£${d.mrr.toLocaleString()}`,  icon: PoundSterling, color: "text-emerald-600 bg-emerald-50", href: "/customers" },
    { label: "Active customers",  value: d.activeCount,                 icon: Users,         color: "text-blue-600 bg-blue-50",      href: "/customers" },
    { label: "Visits this week",  value: d.visitsThisWeek,              icon: Calendar,      color: "text-purple-600 bg-purple-50",  href: "/visits" },
    { label: "Properties",        value: d.propertyCount,               icon: Home,          color: "text-sky-600 bg-sky-50",        href: "/properties" },
    { label: "Unsigned reports",  value: d.unsignedReports.length,      icon: ClipboardList, color: "text-amber-600 bg-amber-50",    href: "/visits" },
    { label: "Unassigned visits", value: d.unassignedVisits.length,     icon: Clock,         color: "text-orange-600 bg-orange-50",  href: "/visits" },
    { label: "Follow-ups needed", value: d.followUpVisits.length,       icon: AlertCircle,   color: "text-red-600 bg-red-50",        href: "/visits" },
    { label: "Emergency visits",  value: d.emergencyVisits,             icon: Zap,           color: "text-rose-600 bg-rose-50",      href: "/visits" },
  ];

  const tierOrder = ["BASIC", "STANDARD", "PLUS", "PREMIUM", "ENTERPRISE"];
  const tierColors: Record<string, string> = {
    BASIC: "bg-gray-200", STANDARD: "bg-blue-300", PLUS: "bg-purple-400",
    PREMIUM: "bg-brand-500", ENTERPRISE: "bg-emerald-500",
  };
  const tierMap = Object.fromEntries(d.tierBreakdown.map((t) => [t.subscriptionTier, t._count]));
  const maxTierCount = Math.max(...Object.values(tierMap), 1);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, href }) => (
          <Link
            key={label}
            href={href}
            className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4 hover:border-gray-300 hover:shadow-sm transition-all"
          >
            <div className={`p-3 rounded-xl shrink-0 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 leading-tight">{label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Upcoming visits + tier breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Upcoming visits</h2>
            <Link href="/visits" className="text-xs text-brand-600 hover:underline font-medium">
              View all
            </Link>
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
                  <tr key={v.id} className="hover:bg-gray-50 transition-colors cursor-pointer group">
                    <td className="px-5 py-3 whitespace-nowrap">
                      <Link href={`/visits/${v.id}`} className="block text-gray-900 group-hover:text-brand-600">
                        {new Date(v.scheduledAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </Link>
                      <p className="text-xs text-gray-400">
                        {new Date(v.scheduledAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      <Link href={`/visits/${v.id}`} className="block">
                        <p className="font-medium text-gray-900 group-hover:text-brand-600">
                          {v.property.customer.user.name ?? "—"}
                        </p>
                        <p className="text-gray-400 text-xs">{v.property.address}</p>
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${v.isEmergency ? "bg-red-100 text-red-700" : (typeColors[v.type] ?? "bg-blue-50 text-blue-700")}`}>
                        {v.isEmergency ? "Emergency" : (VISIT_TYPE_LABELS[v.type] ?? v.type)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {v.technician ? v.technician.user.name : (
                        <span className="text-orange-500 font-medium">Unassigned</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Tier breakdown */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900">Subscriptions by tier</h2>
            <Link href="/customers" className="text-xs text-brand-600 hover:underline font-medium">View all</Link>
          </div>
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
                      <span className="text-sm text-gray-700 font-medium">
                        {tier.charAt(0) + tier.slice(1).toLowerCase()}
                      </span>
                      <span className="text-sm text-gray-500">{count} · £{TIER_PRICES[tier]}/mo</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${tierColors[tier]}`} style={{ width: `${(count / maxTierCount) * 100}%` }} />
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

      {/* Needs attention */}
      <div>
        <h2 className="font-semibold text-gray-900 mb-4">Needs attention</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Unassigned visits */}
          <AttentionPanel
            title="Unassigned visits"
            count={d.unassignedVisits.length}
            emptyText="All upcoming visits have a technician."
            href="/visits"
          >
            {d.unassignedVisits.map((v) => (
              <AttentionRow
                key={v.id}
                href={`/visits/${v.id}`}
                primary={v.property.customer.user.name ?? "—"}
                secondary={v.property.address}
                badge={new Date(v.scheduledAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                badgeStyle="bg-orange-50 text-orange-700"
              />
            ))}
          </AttentionPanel>

          {/* Unsigned reports */}
          <AttentionPanel
            title="Unsigned reports"
            count={d.unsignedReports.length}
            emptyText="All completed visit reports are signed."
            href="/visits"
          >
            {d.unsignedReports.map((v) => (
              <AttentionRow
                key={v.id}
                href={`/visits/${v.id}/report`}
                primary={v.property.customer.user.name ?? "—"}
                secondary={v.property.address}
                badge={v.technician?.user.name ?? "Unassigned"}
                badgeStyle="bg-amber-50 text-amber-700"
              />
            ))}
          </AttentionPanel>

          {/* Follow-ups needed */}
          <AttentionPanel
            title="Follow-ups needed"
            count={d.followUpVisits.length}
            emptyText="No follow-up visits pending."
            href="/visits"
          >
            {d.followUpVisits.map((v) => (
              <AttentionRow
                key={v.id}
                href={`/visits/${v.id}`}
                primary={v.property.customer.user.name ?? "—"}
                secondary={v.property.address}
                badge="Follow-up"
                badgeStyle="bg-red-50 text-red-600"
              />
            ))}
          </AttentionPanel>

        </div>
      </div>
    </div>
  );
}

function AttentionPanel({
  title, count, emptyText, href, children,
}: {
  title: string; count: number; emptyText: string; href: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-medium text-gray-900">{title}</h3>
        <div className="flex items-center gap-2">
          {count > 0 && (
            <span className="text-xs font-semibold bg-red-50 text-red-600 px-2 py-0.5 rounded-full">{count}</span>
          )}
          <Link href={href} className="text-xs text-brand-600 hover:underline font-medium">View all</Link>
        </div>
      </div>
      <div className="divide-y divide-gray-100">
        {count === 0 ? (
          <p className="px-5 py-6 text-sm text-gray-400 text-center">{emptyText}</p>
        ) : children}
      </div>
    </div>
  );
}

function AttentionRow({
  href, primary, secondary, badge, badgeStyle,
}: {
  href: string; primary: string; secondary: string; badge: string; badgeStyle: string;
}) {
  return (
    <Link href={href} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors">
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{primary}</p>
        <p className="text-xs text-gray-400 truncate">{secondary}</p>
      </div>
      <span className={`ml-3 shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${badgeStyle}`}>
        {badge}
      </span>
    </Link>
  );
}
