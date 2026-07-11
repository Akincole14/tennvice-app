import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  Users, Home, Calendar,
  PoundSterling, Clock, Zap,
  TrendingUp, CheckCircle, Building2, Mail, LayoutDashboard,
} from "lucide-react";
import ManagerSignOutButton from "@/components/ManagerSignOutButton";
import QuoteSentButton from "@/components/QuoteSentButton";
import { TIER_LABELS } from "@/lib/utils";

const TIER_PRICES: Record<string, number> = {
  BASIC: 19, STANDARD: 26, PLUS: 35, PREMIUM: 40, ENTERPRISE: 0,
};

function buildMailto(email: string, name: string, props: string | null, rooms: string | null): string {
  const subject = `Tennvice Landlord Quote – ${name}`;
  const body = [
    `Dear ${name},`,
    ``,
    `Thank you for your interest in Tennvice. We have received your landlord enquiry and are pleased to follow up with a tailored quote.`,
    ``,
    `Enquiry details on file:`,
    `• Number of properties: ${props ?? "—"}`,
    `• Rooms per property: ${rooms ?? "—"}`,
    ``,
    `[YOUR QUOTE DETAILS AND PRICING HERE]`,
    ``,
    `Our Landlords plan includes:`,
    `• 12 scheduled visits per year`,
    `• 20% discount on parts & labour (after 6 months)`,
    `• Unlimited emergency call-outs`,
    `• Dedicated account manager`,
    ``,
    `If you have any questions or would like to discuss further, please don't hesitate to reply to this email.`,
    ``,
    `Kind regards,`,
    `[YOUR NAME]`,
    `Tennvice`,
    `home@tennvice.com`,
    `tennvice.com`,
  ].join("\n");
  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

async function getDashboardData() {
  const now        = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

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
    pendingEnquiries,
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
      where:  { status: "SCHEDULED", scheduledAt: { gte: now }, technicianId: null },
      select: { id: true },
    }),
    prisma.visit.count({ where: { isEmergency: true, status: "SCHEDULED" } }),
    prisma.customer.groupBy({
      by:    ["subscriptionTier"],
      where: { subscriptionStatus: "ACTIVE" },
      _count: true,
    }),
    prisma.customer.findMany({
      where:  { subscriptionStatus: "PENDING" },
      select: {
        id: true, createdAt: true,
        landlordProperties: true, landlordRooms: true, landlordQuoteSentAt: true,
        user: { select: { name: true, email: true, phone: true } },
      },
      orderBy: { createdAt: "desc" },
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
    pendingEnquiries,
  };
}

export default async function ManagerDashboardPage() {
  await getServerSession(authOptions);

  const d = await getDashboardData();

  const now     = new Date();
  const dateStr = now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const statCards = [
    { label: "Monthly revenue",      value: `£${d.mrr.toLocaleString()}`,    icon: PoundSterling, color: "text-emerald-600 bg-emerald-50", href: "/manager/reports"      },
    { label: "Active customers",     value: d.activeCount,                    icon: Users,         color: "text-blue-600 bg-blue-50",      href: "/manager/customers"    },
    { label: "Visits this week",     value: d.visitsThisWeek,                 icon: Calendar,      color: "text-purple-600 bg-purple-50",  href: "/manager/visit-reports"},
    { label: "Unassigned visits",    value: d.unassignedVisits.length,        icon: Clock,         color: "text-orange-600 bg-orange-50",  href: "/manager/visit-reports"},
    { label: "Annual revenue (ARR)", value: `£${d.arr.toLocaleString()}`,     icon: TrendingUp,    color: "text-teal-600 bg-teal-50",      href: "/manager/reports"      },
    { label: "Properties",           value: d.propertyCount,                  icon: Home,          color: "text-sky-600 bg-sky-50",        href: "/manager/customers"    },
    { label: "Completed this month", value: d.completedThisMonth,             icon: CheckCircle,   color: "text-green-600 bg-green-50",    href: "/manager/visit-reports"},
    { label: "Emergency visits",     value: d.emergencyVisits,                icon: Zap,           color: "text-rose-600 bg-rose-50",      href: "/manager/visit-reports"},
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
    <div className="max-w-6xl mx-auto space-y-5 md:space-y-8 py-4 md:py-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="w-6 h-6 text-brand-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 text-sm mt-0.5">{dateStr}</p>
          </div>
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
          <ManagerSignOutButton />
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {statCards.map(({ label, value, icon: Icon, color, href }, i) => (
          <Link
            key={label}
            href={href}
            className={`bg-white rounded-2xl border border-gray-200 p-3 sm:p-5 flex-col sm:flex-row items-center sm:items-start gap-1.5 sm:gap-3 text-center sm:text-left hover:border-gray-300 hover:shadow-sm transition-all ${i >= 4 ? "hidden md:flex" : "flex"}`}
          >
            <div className={`p-2 sm:p-2.5 rounded-xl shrink-0 ${color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-lg sm:text-xl font-bold text-gray-900">{value}</p>
              <p className="text-[10px] sm:text-xs text-gray-500 leading-tight">{label}</p>
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
            <Link href="/manager/customers" className="text-xs text-amber-700 hover:underline font-medium">View all customers</Link>
          </div>
          <div className="divide-y divide-amber-100">
            {d.pendingEnquiries.map(c => (
              <div key={c.id} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-6 py-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{c.user.name ?? "—"}</p>
                  <p className="text-sm text-gray-500 truncate">{c.user.email}</p>
                  {c.user.phone && <p className="text-xs text-gray-400">{c.user.phone}</p>}
                </div>
                <div className="flex sm:flex-col sm:text-right sm:shrink-0 items-center sm:items-end gap-3 sm:gap-0.5">
                  {c.landlordProperties ? (
                    <>
                      <span className="text-sm font-semibold text-amber-800">{c.landlordProperties} properties</span>
                      {c.landlordRooms && <span className="text-xs text-amber-700">{c.landlordRooms} rooms each</span>}
                    </>
                  ) : (
                    <span className="text-xs text-gray-400 italic">No details submitted</span>
                  )}
                  <span className="text-xs text-gray-400 sm:mt-0.5">
                    {new Date(c.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
                <div className="flex sm:flex-col sm:shrink-0 gap-2">
                  <a
                    href={buildMailto(c.user.email ?? "", c.user.name ?? "Customer", c.landlordProperties, c.landlordRooms)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-brand-600 text-white hover:bg-brand-700 transition-colors whitespace-nowrap"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Send quote
                  </a>
                  <QuoteSentButton customerId={c.id} quoteSentAt={c.landlordQuoteSentAt} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subscriptions tier panel */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 max-w-sm">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-gray-900">Subscriptions</h2>
          <Link href="/manager/customers" className="text-xs text-brand-600 hover:underline font-medium">View all</Link>
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
