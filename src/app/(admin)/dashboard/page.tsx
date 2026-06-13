import Link from "next/link";
import SignOutButton from "@/components/SignOutButton";
import { TIER_LABELS } from "@/lib/utils";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  Users, Home, Calendar, AlertCircle, PoundSterling,
  Clock, Zap, ClipboardList, TrendingUp, CheckCircle,
  Award, Activity, Wrench, ChevronRight, Building2,
} from "lucide-react";

const TIER_PRICES: Record<string, number> = {
  BASIC: 19, STANDARD: 26, PLUS: 35, PREMIUM: 40, ENTERPRISE: 0,
};

const typeLabels: Record<string, string> = {
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

const statusColors: Record<string, string> = {
  SCHEDULED:   "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-yellow-100 text-yellow-700",
  COMPLETED:   "bg-green-100 text-green-700",
  CANCELLED:   "bg-red-100 text-red-700",
};

async function getDashboardData() {
  const now       = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd   = new Date(todayStart); todayEnd.setDate(todayEnd.getDate() + 1);

  const weekStart = new Date(todayStart);
  weekStart.setDate(todayStart.getDate() - todayStart.getDay());
  const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 7);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd   = new Date(monthStart);

  const visitInclude = {
    property: {
      include: { customer: { include: { user: { select: { name: true } } } } },
    },
    technician: { include: { user: { select: { name: true } } } },
  } as const;

  const [
    activeCustomers,
    allCustomers,
    propertyCount,
    visitsThisWeek,
    completedThisMonth,
    newCustomersThisMonth,
    newCustomersLastMonth,
    todayVisits,
    upcomingVisits,
    unassignedVisits,
    unsignedReports,
    followUpVisits,
    emergencyVisits,
    tierBreakdown,
    technicianWorkload,
    pendingCertificates,
    recentVisits,
    recentCustomers,
    pendingEnquiries,
  ] = await Promise.all([
    prisma.customer.findMany({
      where: { subscriptionStatus: "ACTIVE" },
      select: { subscriptionTier: true },
    }),
    prisma.customer.count(),
    prisma.property.count(),
    prisma.visit.count({ where: { scheduledAt: { gte: weekStart, lt: weekEnd } } }),
    prisma.visit.count({ where: { status: "COMPLETED", completedAt: { gte: monthStart } } }),
    prisma.customer.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.customer.count({ where: { createdAt: { gte: lastMonthStart, lt: lastMonthEnd } } }),
    prisma.visit.findMany({
      where: { scheduledAt: { gte: todayStart, lt: todayEnd }, status: { not: "CANCELLED" } },
      include: visitInclude,
      orderBy: { scheduledAt: "asc" },
    }),
    prisma.visit.findMany({
      where: { status: "SCHEDULED", scheduledAt: { gte: todayEnd } },
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
      where: { status: "COMPLETED", report: { followUpRequired: true } },
      include: visitInclude,
      orderBy: { scheduledAt: "desc" },
      take: 5,
    }),
    prisma.visit.count({ where: { isEmergency: true, status: "SCHEDULED" } }),
    prisma.customer.groupBy({
      by: ["subscriptionTier"],
      where: { subscriptionStatus: "ACTIVE" },
      _count: true,
    }),
    prisma.technician.findMany({
      include: {
        user: { select: { name: true } },
        visits: {
          where: { status: { in: ["SCHEDULED", "IN_PROGRESS"] }, scheduledAt: { gte: now } },
          select: { id: true },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.technicianCertificate.findMany({
      where: { status: "PENDING" },
      include: {
        technician: { include: { user: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.visit.findMany({
      include: visitInclude,
      orderBy: { updatedAt: "desc" },
      take: 6,
    }),
    prisma.customer.findMany({
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    prisma.customer.findMany({
      where: { subscriptionStatus: "PENDING" },
      include: { user: { select: { name: true, email: true, phone: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const mrr = activeCustomers.reduce((sum, c) => sum + (TIER_PRICES[c.subscriptionTier] ?? 0), 0);
  const arr = mrr * 12;
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
    todayVisits,
    upcomingVisits,
    unassignedVisits,
    unsignedReports,
    followUpVisits,
    emergencyVisits,
    tierBreakdown,
    technicianWorkload,
    pendingCertificates,
    recentVisits,
    recentCustomers,
    pendingEnquiries,
  };
}

export default async function DashboardPage() {
  const session   = await getServerSession(authOptions);
  const adminRole = (session?.user as any)?.adminRole ?? null;
  const isSenior  = !adminRole || adminRole === "SENIOR";

  const d = await getDashboardData();

  const now      = new Date();
  const dateStr  = now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  // Revenue cards hidden for STANDARD admins
  const allStatCards = [
    { label: "Monthly revenue",      value: `£${d.mrr.toLocaleString()}`,      icon: PoundSterling, color: "text-emerald-600 bg-emerald-50", href: "/customers", seniorOnly: true },
    { label: "Active customers",     value: d.activeCount,                      icon: Users,         color: "text-blue-600 bg-blue-50",      href: "/customers", seniorOnly: false },
    { label: "Visits this week",     value: d.visitsThisWeek,                   icon: Calendar,      color: "text-purple-600 bg-purple-50",  href: "/visits",    seniorOnly: false },
    { label: "Unassigned visits",    value: d.unassignedVisits.length,          icon: Clock,         color: "text-orange-600 bg-orange-50",  href: "/visits",    seniorOnly: false },
    { label: "Annual revenue (ARR)", value: `£${d.arr.toLocaleString()}`,       icon: TrendingUp,    color: "text-teal-600 bg-teal-50",      href: "/customers", seniorOnly: true },
    { label: "Properties",           value: d.propertyCount,                    icon: Home,          color: "text-sky-600 bg-sky-50",        href: "/properties", seniorOnly: false },
    { label: "Completed this month", value: d.completedThisMonth,               icon: CheckCircle,   color: "text-green-600 bg-green-50",    href: "/visits",    seniorOnly: false },
    { label: "Emergency visits",     value: d.emergencyVisits,                  icon: Zap,           color: "text-rose-600 bg-rose-50",      href: "/visits",    seniorOnly: false },
  ];
  const statCards = allStatCards.filter(c => isSenior || !c.seniorOnly);

  const tierOrder  = ["BASIC", "STANDARD", "PLUS", "PREMIUM", "ENTERPRISE"];
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
          <SignOutButton />
        </div>
      </div>

      {/* Stat cards — first 4 on mobile, all 8 on desktop */}
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

      {/* Pending landlord enquiries */}
      {d.pendingEnquiries.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 overflow-hidden">
          <div className="px-6 py-4 border-b border-amber-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-600 shrink-0" />
              <h2 className="font-semibold text-amber-900">Pending Enquiries</h2>
              <span className="text-xs font-semibold bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">
                {d.pendingEnquiries.length}
              </span>
            </div>
            <Link href="/customers" className="text-xs text-amber-700 hover:underline font-medium">View all customers</Link>
          </div>
          <div className="divide-y divide-amber-100">
            {d.pendingEnquiries.map(c => (
              <Link
                key={c.id}
                href={`/customers/${c.id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-amber-100/60 transition-colors group"
              >
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 group-hover:text-brand-600">
                    {c.user.name ?? "—"}
                  </p>
                  <p className="text-sm text-gray-500">{c.user.email}</p>
                  {c.user.phone && <p className="text-xs text-gray-400">{c.user.phone}</p>}
                </div>
                <div className="text-right shrink-0 ml-6 space-y-0.5">
                  {c.landlordProperties ? (
                    <>
                      <p className="text-sm font-semibold text-amber-800">{c.landlordProperties} properties</p>
                      {c.landlordRooms && <p className="text-xs text-amber-700">{c.landlordRooms} rooms each</p>}
                    </>
                  ) : (
                    <p className="text-xs text-gray-400 italic">No details submitted</p>
                  )}
                  <p className="text-xs text-gray-400">
                    {new Date(c.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Today's schedule */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-gray-900">Today's schedule</h2>
            {d.todayVisits.length > 0 && (
              <span className="text-xs font-semibold bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full">
                {d.todayVisits.length} visit{d.todayVisits.length > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <Link href="/visits" className="text-xs text-brand-600 hover:underline font-medium">View all visits</Link>
        </div>
        {d.todayVisits.length === 0 ? (
          <p className="px-6 py-8 text-sm text-gray-400 text-center">No visits scheduled for today.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {d.todayVisits.map(v => (
              <Link
                key={v.id}
                href={`/visits/${v.id}`}
                className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors group"
              >
                <div className="text-right w-14 shrink-0">
                  <p className="text-sm font-semibold text-gray-900">
                    {new Date(v.scheduledAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <div className="w-px h-8 bg-gray-200 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 group-hover:text-brand-600 truncate">
                    {v.property.customer.user.name ?? "—"} · {v.property.address.split(",")[0]}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {v.technician ? v.technician.user.name : <span className="text-orange-500 font-medium">Unassigned</span>}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${v.isEmergency ? "bg-red-100 text-red-700" : (typeColors[v.type] ?? "bg-gray-100 text-gray-600")}`}>
                    {v.isEmergency ? "Emergency" : (typeLabels[v.type] ?? v.type)}
                  </span>
                  <span className={`hidden sm:inline text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${statusColors[v.status]}`}>
                    {v.status.replace("_", " ")}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Mobile quick-nav */}
      <div className="md:hidden grid grid-cols-3 gap-3">
        {[
          { href: "/customers",   icon: Users,    label: "Customers",   count: d.activeCount,              color: "text-blue-500"   },
          { href: "/visits",      icon: Calendar, label: "Visits",      count: d.visitsThisWeek,            color: "text-purple-500" },
          { href: "/technicians", icon: Wrench,   label: "Technicians", count: d.technicianWorkload.length, color: "text-brand-500"  },
        ].map(({ href, icon: Icon, label, count, color }) => (
          <Link key={href} href={href} className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col items-center gap-1.5 text-center hover:border-gray-300 transition-all">
            <Icon className={`w-5 h-5 ${color}`} />
            <p className="text-lg font-bold text-gray-900">{count}</p>
            <p className="text-xs text-gray-500">{label}</p>
          </Link>
        ))}
      </div>

      {/* Upcoming visits + tier breakdown */}
      <div className="hidden md:grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Upcoming visits</h2>
            <Link href="/visits" className="text-xs text-brand-600 hover:underline font-medium">View all</Link>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[420px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["Date", "Customer", "Type", "Technician"].map(h => (
                  <th key={h} className="text-left px-5 py-3 font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {d.upcomingVisits.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-10 text-gray-400 text-sm">No upcoming visits scheduled.</td></tr>
              ) : d.upcomingVisits.map(v => (
                <tr key={v.id} className="hover:bg-gray-50 transition-colors cursor-pointer group">
                  <td className="px-5 py-3 whitespace-nowrap">
                    <Link href={`/visits/${v.id}`} className="block text-gray-900 group-hover:text-brand-600 font-medium">
                      {new Date(v.scheduledAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </Link>
                    <p className="text-xs text-gray-400">
                      {new Date(v.scheduledAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </td>
                  <td className="px-5 py-3">
                    <Link href={`/visits/${v.id}`} className="block">
                      <p className="font-medium text-gray-900 group-hover:text-brand-600 truncate max-w-[160px]">
                        {v.property.customer.user.name ?? "—"}
                      </p>
                      <p className="text-gray-400 text-xs truncate max-w-[160px]">{v.property.address.split(",")[0]}</p>
                    </Link>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${v.isEmergency ? "bg-red-100 text-red-700" : (typeColors[v.type] ?? "bg-blue-50 text-blue-700")}`}>
                      {v.isEmergency ? "Emergency" : (typeLabels[v.type] ?? v.type)}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-600 text-sm">
                    {v.technician ? v.technician.user.name : <span className="text-orange-500 font-medium">Unassigned</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>

        {/* Tier breakdown */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900">Subscriptions</h2>
            <Link href="/customers" className="text-xs text-brand-600 hover:underline font-medium">View all</Link>
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
                      <span className="text-sm text-gray-500">{count}{isSenior ? ` · £${TIER_PRICES[tier]}/mo` : ""}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${tierBarColors[tier]}`} style={{ width: `${(count / maxTierCount) * 100}%` }} />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{pct}% of customers</p>
                  </div>
                );
              })}
              <div className="pt-3 border-t border-gray-100 space-y-1.5 text-sm">
                {isSenior && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-500">MRR</span>
                      <span className="font-bold text-emerald-600">£{d.mrr.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">ARR</span>
                      <span className="font-bold text-emerald-600">£{d.arr.toLocaleString()}</span>
                    </div>
                  </>
                )}
                {isSenior && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Avg per customer</span>
                    <span className="font-semibold text-gray-700">£{d.avgRevenue}/mo</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Technician workload + recent activity */}
      <div className="hidden md:grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Technician workload */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Technician workload</h2>
            <Link href="/technicians" className="text-xs text-brand-600 hover:underline font-medium">View all</Link>
          </div>
          {d.technicianWorkload.length === 0 ? (
            <p className="px-6 py-8 text-sm text-gray-400 text-center">No technicians added yet.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {d.technicianWorkload.map(t => {
                const count  = t.visits.length;
                const maxLoad = 10;
                const pct    = Math.min(Math.round((count / maxLoad) * 100), 100);
                const barColor = count === 0 ? "bg-gray-200" : count < 4 ? "bg-green-400" : count < 7 ? "bg-amber-400" : "bg-red-400";
                return (
                  <Link
                    key={t.id}
                    href={`/technicians/${t.id}`}
                    className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50 transition-colors group"
                  >
                    <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-xs shrink-0">
                      {t.user.name?.charAt(0) ?? "T"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 group-hover:text-brand-600">{t.user.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-gray-500 shrink-0">{count} upcoming</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Recent activity</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {d.recentCustomers.slice(0, 2).map(c => (
              <Link key={c.id} href="/customers" className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50 transition-colors">
                <div className="p-1.5 bg-blue-50 rounded-lg shrink-0"><Users className="w-3.5 h-3.5 text-blue-500" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 truncate">
                    <span className="font-medium">{c.user.name}</span> joined as a customer
                  </p>
                  <p className="text-xs text-gray-400">{timeAgo(c.createdAt)}</p>
                </div>
              </Link>
            ))}
            {d.recentVisits.map(v => (
              <Link key={v.id} href={`/visits/${v.id}`} className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50 transition-colors">
                <div className={`p-1.5 rounded-lg shrink-0 ${
                  v.status === "COMPLETED" ? "bg-green-50" :
                  v.status === "IN_PROGRESS" ? "bg-yellow-50" : "bg-gray-50"
                }`}>
                  <Calendar className={`w-3.5 h-3.5 ${
                    v.status === "COMPLETED" ? "text-green-500" :
                    v.status === "IN_PROGRESS" ? "text-yellow-500" : "text-gray-400"
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 truncate">
                    <span className="font-medium">{v.property.customer.user.name ?? "—"}</span>
                    {" "}visit {v.status === "COMPLETED" ? "completed" : v.status === "IN_PROGRESS" ? "in progress" : "scheduled"}
                  </p>
                  <p className="text-xs text-gray-400">{timeAgo(v.updatedAt)}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${statusColors[v.status]}`}>
                  {v.status.replace("_", " ")}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Needs attention */}
      <div className="hidden md:block">
        <h2 className="font-semibold text-gray-900 mb-4">Needs attention</h2>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <AttentionPanel title="Pending enquiries" count={d.pendingEnquiries.length} emptyText="No landlord enquiries pending." href="/customers" badgeStyle="bg-amber-50 text-amber-700">
            {d.pendingEnquiries.slice(0, 5).map(c => (
              <AttentionRow key={c.id} href={`/customers/${c.id}`}
                primary={c.user.name ?? "—"}
                secondary={c.landlordProperties ? `${c.landlordProperties} props · ${c.landlordRooms ?? "rooms TBC"}` : c.user.email ?? "—"}
                badge="Pending" badgeStyle="bg-blue-50 text-blue-700"
              />
            ))}
          </AttentionPanel>

          <AttentionPanel title="Unassigned visits" count={d.unassignedVisits.length} emptyText="All visits have a technician." href="/visits">
            {d.unassignedVisits.map(v => (
              <AttentionRow key={v.id} href={`/visits/${v.id}`}
                primary={v.property.customer.user.name ?? "—"}
                secondary={v.property.address.split(",")[0]}
                badge={new Date(v.scheduledAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                badgeStyle="bg-orange-50 text-orange-700"
              />
            ))}
          </AttentionPanel>

          <AttentionPanel title="Unsigned reports" count={d.unsignedReports.length} emptyText="All reports are signed." href="/visits">
            {d.unsignedReports.map(v => (
              <AttentionRow key={v.id} href={`/visits/${v.id}/report`}
                primary={v.property.customer.user.name ?? "—"}
                secondary={v.technician?.user.name ?? "Unassigned"}
                badge="Unsigned" badgeStyle="bg-amber-50 text-amber-700"
              />
            ))}
          </AttentionPanel>

          <AttentionPanel title="Follow-ups needed" count={d.followUpVisits.length} emptyText="No follow-up visits pending." href="/visits">
            {d.followUpVisits.map(v => (
              <AttentionRow key={v.id} href={`/visits/${v.id}`}
                primary={v.property.customer.user.name ?? "—"}
                secondary={v.property.address.split(",")[0]}
                badge="Follow-up" badgeStyle="bg-red-50 text-red-600"
              />
            ))}
          </AttentionPanel>

          <AttentionPanel title="Certificate queue" count={d.pendingCertificates.length} emptyText="No certificates pending review." href="/technicians">
            {d.pendingCertificates.map(c => (
              <AttentionRow key={c.id}
                href={`/technicians/${c.technicianId}`}
                primary={c.technician.user.name ?? "—"}
                secondary={c.aiCertName ?? c.fileName}
                badge={c.aiValid ? "Valid" : "Review"}
                badgeStyle={c.aiValid ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}
              />
            ))}
          </AttentionPanel>
        </div>
      </div>
    </div>
  );
}

function timeAgo(date: Date): string {
  const secs = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (secs < 60)   return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

function AttentionPanel({ title, count, emptyText, href, badgeStyle, children }: {
  title: string; count: number; emptyText: string; href: string; badgeStyle?: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-medium text-gray-900 text-sm">{title}</h3>
        <div className="flex items-center gap-2">
          {count > 0 && (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeStyle ?? "bg-red-50 text-red-600"}`}>{count}</span>
          )}
          <Link href={href} className="text-xs text-brand-600 hover:underline font-medium">View all</Link>
        </div>
      </div>
      <div className="divide-y divide-gray-100">
        {count === 0
          ? <p className="px-5 py-6 text-sm text-gray-400 text-center">{emptyText}</p>
          : children}
      </div>
    </div>
  );
}

function AttentionRow({ href, primary, secondary, badge, badgeStyle }: {
  href: string; primary: string; secondary: string; badge: string; badgeStyle: string;
}) {
  return (
    <Link href={href} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors">
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{primary}</p>
        <p className="text-xs text-gray-400 truncate">{secondary}</p>
      </div>
      <span className={`ml-3 shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${badgeStyle}`}>{badge}</span>
    </Link>
  );
}
