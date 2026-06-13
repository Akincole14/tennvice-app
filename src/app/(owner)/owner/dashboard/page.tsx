import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  Users, Home, Calendar,
  PoundSterling, Clock, Zap,
  TrendingUp, CheckCircle,
} from "lucide-react";
import OwnerSignOutButton from "@/components/OwnerSignOutButton";
import { TIER_LABELS } from "@/lib/utils";

const TIER_PRICES: Record<string, number> = {
  BASIC: 19, STANDARD: 26, PLUS: 35, PREMIUM: 40, ENTERPRISE: 0,
};

async function getDashboardData() {
  const now        = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd   = new Date(todayStart); todayEnd.setDate(todayEnd.getDate() + 1);

  const weekStart = new Date(todayStart);
  weekStart.setDate(todayStart.getDate() - todayStart.getDay());
  const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 7);

  const monthStart      = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart  = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd    = new Date(monthStart);

  const [
    activeCustomers,
    allCustomers,
    propertyCount,
    visitsThisWeek,
    completedThisMonth,
    newCustomersThisMonth,
    newCustomersLastMonth,
    unassignedVisits,
    emergencyVisits,
    tierBreakdown,
  ] = await Promise.all([
    prisma.customer.findMany({
      where:  { subscriptionStatus: "ACTIVE" },
      select: { subscriptionTier: true },
    }),
    prisma.customer.count(),
    prisma.property.count(),
    prisma.visit.count({ where: { scheduledAt: { gte: weekStart, lt: weekEnd } } }),
    prisma.visit.count({ where: { status: "COMPLETED", completedAt: { gte: monthStart } } }),
    prisma.customer.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.customer.count({ where: { createdAt: { gte: lastMonthStart, lt: lastMonthEnd } } }),
    prisma.visit.findMany({
      where:   { status: "SCHEDULED", scheduledAt: { gte: now }, technicianId: null },
      select:  { id: true },
    }),
    prisma.visit.count({ where: { isEmergency: true, status: "SCHEDULED" } }),
    prisma.customer.groupBy({
      by:    ["subscriptionTier"],
      where: { subscriptionStatus: "ACTIVE" },
      _count: true,
    }),
  ]);

  const mrr        = activeCustomers.reduce((sum, c) => sum + (TIER_PRICES[c.subscriptionTier] ?? 0), 0);
  const arr        = mrr * 12;
  const avgRevenue = activeCustomers.length ? Math.round(mrr / activeCustomers.length) : 0;

  return {
    mrr, arr, avgRevenue,
    activeCount: activeCustomers.length,
    allCustomers,
    propertyCount,
    visitsThisWeek,
    completedThisMonth,
    newCustomersThisMonth,
    newCustomersLastMonth,
    unassignedVisits,
    emergencyVisits,
    tierBreakdown,
  };
}

export default async function OwnerDashboardPage() {
  await getServerSession(authOptions);

  const d = await getDashboardData();

  const now     = new Date();
  const dateStr = now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const statCards = [
    { label: "Monthly revenue",      value: `£${d.mrr.toLocaleString()}`,    icon: PoundSterling, color: "text-emerald-600 bg-emerald-50", href: "/owner/customers" },
    { label: "Active customers",     value: d.activeCount,                    icon: Users,         color: "text-blue-600 bg-blue-50",      href: "/owner/customers" },
    { label: "Visits this week",     value: d.visitsThisWeek,                 icon: Calendar,      color: "text-purple-600 bg-purple-50",  href: "/owner/dashboard" },
    { label: "Unassigned visits",    value: d.unassignedVisits.length,        icon: Clock,         color: "text-orange-600 bg-orange-50",  href: "/owner/dashboard" },
    { label: "Annual revenue (ARR)", value: `£${d.arr.toLocaleString()}`,     icon: TrendingUp,    color: "text-teal-600 bg-teal-50",      href: "/owner/reports"   },
    { label: "Properties",           value: d.propertyCount,                  icon: Home,          color: "text-sky-600 bg-sky-50",        href: "/owner/dashboard" },
    { label: "Completed this month", value: d.completedThisMonth,             icon: CheckCircle,   color: "text-green-600 bg-green-50",    href: "/owner/dashboard" },
    { label: "Emergency visits",     value: d.emergencyVisits,                icon: Zap,           color: "text-rose-600 bg-rose-50",      href: "/owner/dashboard" },
  ];

  const tierOrder     = ["BASIC", "STANDARD", "PLUS", "PREMIUM", "ENTERPRISE"];
  const tierBarColors: Record<string, string> = {
    BASIC: "bg-gray-300", STANDARD: "bg-blue-400", PLUS: "bg-purple-400",
    PREMIUM: "bg-brand-500", ENTERPRISE: "bg-emerald-500",
  };
  const tierMap      = Object.fromEntries(d.tierBreakdown.map(t => [t.subscriptionTier, t._count]));
  const maxTierCount = Math.max(...Object.values(tierMap), 1);

  const customerGrowth = d.newCustomersLastMonth > 0
    ? Math.round(((d.newCustomersThisMonth - d.newCustomersLastMonth) / d.newCustomersLastMonth) * 100)
    : null;

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-4 md:py-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">{dateStr}</p>
        </div>
        <div className="flex items-center gap-3">
          {d.newCustomersThisMonth > 0 && (
            <div className="hidden sm:flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2 text-sm text-green-700">
              <TrendingUp className="w-4 h-4" />
              <span className="font-medium">{d.newCustomersThisMonth} new customer{d.newCustomersThisMonth > 1 ? "s" : ""} this month</span>
              {customerGrowth !== null && (
                <span className="text-xs text-green-500">({customerGrowth >= 0 ? "+" : ""}{customerGrowth}% vs last month)</span>
              )}
            </div>
          )}
          <OwnerSignOutButton />
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {statCards.map(({ label, value, icon: Icon, color, href }, i) => (
          <Link
            key={label}
            href={href}
            className={`bg-white rounded-2xl border border-gray-200 p-3 md:p-5 items-center gap-3 md:gap-4 hover:border-gray-300 hover:shadow-sm transition-all ${i >= 4 ? "hidden md:flex" : "flex"}`}
          >
            <div className={`p-2 md:p-3 rounded-xl shrink-0 ${color}`}>
              <Icon className="w-4 h-4 md:w-5 md:h-5" />
            </div>
            <div>
              <p className="text-xl md:text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 leading-tight">{label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Subscriptions tier panel */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 max-w-sm">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-gray-900">Subscriptions</h2>
          <Link href="/owner/customers" className="text-xs text-brand-600 hover:underline font-medium">View all</Link>
        </div>
        {d.activeCount === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No active customers.</p>
        ) : (
          <div className="space-y-4">
            {tierOrder.map(tier => {
              const count = tierMap[tier] ?? 0;
              const pct   = Math.round((count / d.activeCount) * 100);
              return (
                <div key={tier}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700 font-medium">
                      {TIER_LABELS[tier] ?? tier}
                    </span>
                    <span className="text-sm text-gray-500">{count} · £{TIER_PRICES[tier]}/mo</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${tierBarColors[tier]}`} style={{ width: `${(count / maxTierCount) * 100}%` }} />
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{pct}% of customers</p>
                </div>
              );
            })}
            <div className="pt-3 border-t border-gray-100 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">MRR</span>
                <span className="font-bold text-emerald-600">£{d.mrr.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">ARR</span>
                <span className="font-bold text-emerald-600">£{d.arr.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Avg per customer</span>
                <span className="font-semibold text-gray-700">£{d.avgRevenue}/mo</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
