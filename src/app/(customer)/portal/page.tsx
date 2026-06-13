import { prisma } from "@/lib/prisma";
import { SUBSCRIPTION_TIERS } from "@/lib/utils";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Calendar, Home, CheckCircle, Clock, AlertTriangle, FileText } from "lucide-react";
import SignOutButton from "@/components/SignOutButton";

const TIER_PRICES: Record<string, number> = {
  BASIC: 19, STANDARD: 26, PLUS: 35, PREMIUM: 40, ENTERPRISE: 0,
};

const statusColors: Record<string, string> = {
  SCHEDULED:   "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-yellow-100 text-yellow-700",
  COMPLETED:   "bg-green-100 text-green-700",
  CANCELLED:   "bg-red-100 text-red-700",
};

const typeLabels: Record<string, string> = {
  ROUTINE_PLUMBING:   "Routine Plumbing",
  ROUTINE_ELECTRICAL: "Routine Electrical",
  ROUTINE_BOTH:       "Plumbing & Electrical",
  BOILER_SERVICE:     "Boiler Service",
  EMERGENCY:          "Emergency",
};

async function getCustomerData(userId: string) {
  return prisma.customer.findUnique({
    where: { userId },
    include: {
      user: { select: { name: true } },
      properties: {
        include: {
          visits: {
            include: {
              report: { select: { pipesCheck: true, heatingCheck: true, electricalCheck: true, boilerCheck: true, followUpRequired: true, signedByTechnician: true } },
              technician: { include: { user: { select: { name: true } } } },
            },
            orderBy: { scheduledAt: "desc" },
          },
        },
      },
    },
  });
}

function healthColor(result: string) {
  if (result === "FAIL") return "text-red-600";
  if (result === "ADVISORY") return "text-amber-600";
  if (result === "PASS") return "text-green-600";
  return "text-gray-400";
}

function overallHealth(checks: string[]): { label: string; color: string } {
  if (checks.includes("FAIL")) return { label: "Needs attention", color: "text-red-600" };
  if (checks.includes("ADVISORY")) return { label: "Advisory notes", color: "text-amber-600" };
  if (checks.some(c => c === "PASS")) return { label: "All clear", color: "text-green-600" };
  return { label: "No data", color: "text-gray-400" };
}

export default async function CustomerPortalPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const customer = await getCustomerData((session.user as any).id);
  if (!customer) redirect("/login");

  const tier = SUBSCRIPTION_TIERS[customer.subscriptionTier as keyof typeof SUBSCRIPTION_TIERS];
  const price = TIER_PRICES[customer.subscriptionTier] ?? tier?.price;

  const now = new Date();
  const monthsSubscribed  = (now.getTime() - new Date(customer.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30.44);
  const discountActive    = monthsSubscribed <= 6;
  const effectiveDiscount = discountActive ? Math.min(customer.discountPercent, 20) : 0;

  const allVisits = customer.properties.flatMap((p) =>
    p.visits.map((v) => ({ ...v, propertyAddress: p.address }))
  );

  const nextVisit = allVisits
    .filter((v) => v.status === "SCHEDULED" && new Date(v.scheduledAt) >= now)
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0];

  const completedVisits = allVisits.filter((v) => v.status === "COMPLETED").length;
  const upcomingVisits = allVisits.filter((v) => v.status === "SCHEDULED" && new Date(v.scheduledAt) >= now).length;

  const subscriptionStatusColors: Record<string, string> = {
    ACTIVE:    "bg-green-100 text-green-700",
    PAUSED:    "bg-yellow-100 text-yellow-700",
    CANCELLED: "bg-red-100 text-red-700",
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5 md:space-y-8 py-4 md:py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Home</h1>
          <p className="text-gray-500 mt-1">Welcome back, {customer.user.name?.split(" ")[0] ?? "there"}</p>
        </div>
        <SignOutButton />
      </div>

      {/* Next visit banner */}
      {nextVisit ? (
        <Link href={`/portal/visits/${nextVisit.id}`} className="block bg-brand-600 text-white rounded-2xl p-5 hover:bg-brand-700 transition-colors">
          <p className="text-brand-200 text-xs font-semibold uppercase tracking-wide mb-1">Next visit</p>
          <p className="text-lg font-bold">
            {new Date(nextVisit.scheduledAt).toLocaleDateString("en-GB", {
              weekday: "long", day: "numeric", month: "long",
            })}
            {" at "}
            {new Date(nextVisit.scheduledAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
          </p>
          <p className="text-brand-200 text-sm mt-1">
            {typeLabels[nextVisit.type] ?? nextVisit.type} · {nextVisit.propertyAddress}
            {nextVisit.technician ? ` · ${nextVisit.technician.user.name}` : " · Technician TBC"}
          </p>
        </Link>
      ) : (
        <div className="bg-gray-100 rounded-2xl p-5 text-center text-gray-400 text-sm">
          No upcoming visits scheduled. Contact us to book your next visit.
        </div>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {[
          { icon: CheckCircle, label: "Completed visits", value: completedVisits, color: "text-green-600 bg-green-50" },
          { icon: Clock,       label: "Upcoming visits",  value: upcomingVisits,  color: "text-blue-600 bg-blue-50" },
          { icon: Home,        label: "Properties",       value: customer.properties.length, color: "text-purple-600 bg-purple-50" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-200 p-3 sm:p-5 flex flex-col sm:flex-row items-center sm:items-start gap-1.5 sm:gap-3 text-center sm:text-left">
            <div className={`p-2 sm:p-2.5 rounded-xl shrink-0 ${color}`}><Icon className="w-4 h-4" /></div>
            <div>
              <p className="text-lg sm:text-xl font-bold text-gray-900">{value}</p>
              <p className="text-[10px] sm:text-xs text-gray-500 leading-tight">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Plan card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Your plan</p>
            <p className="text-xl font-bold text-gray-900">{tier?.label ?? customer.subscriptionTier}</p>
            <p className="text-2xl font-bold text-brand-600 mt-0.5">£{price}<span className="text-sm font-normal text-gray-400">/month</span></p>
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${subscriptionStatusColors[customer.subscriptionStatus]}`}>
            {customer.subscriptionStatus.charAt(0) + customer.subscriptionStatus.slice(1).toLowerCase()}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm border-t border-gray-100 pt-4">
          <div className="flex justify-between">
            <span className="text-gray-500">Visits per year</span>
            <span className="font-medium text-gray-900">{customer.visitsPerYear}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Discount</span>
            <span className="font-medium text-gray-900">
              {discountActive
                ? `${effectiveDiscount}% off parts & labour`
                : "0% — introductory offer ended"}
            </span>
          </div>
          {customer.emergencyCallouts > 0 && (
            <div className="flex justify-between col-span-2">
              <span className="text-gray-500">Emergency call-outs</span>
              <span className="font-medium text-gray-900">{customer.emergencyCallouts === Infinity ? "Unlimited" : customer.emergencyCallouts} per year</span>
            </div>
          )}
        </div>
        {tier?.features && (
          <ul className="mt-4 pt-4 border-t border-gray-100 space-y-1.5">
            {tier.features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-green-500 mt-0.5 shrink-0">✓</span>{f}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Properties */}
      <div>
        <h2 className="font-semibold text-gray-900 mb-3">My properties</h2>
        <div className="space-y-3">
        {customer.properties.map((property) => {
        const lastCompleted = property.visits.find((v) => v.status === "COMPLETED" && v.report?.signedByTechnician);
        const nextProp = property.visits
          .filter((v) => v.status === "SCHEDULED" && new Date(v.scheduledAt) >= now)
          .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0];
        const hasFollowUp = property.visits.some((v) => v.report?.followUpRequired && !v.report.signedByTechnician);
        const lastChecks = lastCompleted?.report
          ? [lastCompleted.report.pipesCheck, lastCompleted.report.heatingCheck, lastCompleted.report.electricalCheck, lastCompleted.report.boilerCheck].filter(c => c !== "NOT_CHECKED")
          : [];
        const health = overallHealth(lastChecks);

        return (
          <Link
            key={property.id}
            href={`/portal/properties/${property.id}`}
            className="block bg-white rounded-2xl border border-gray-200 p-5 hover:border-gray-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="p-2 bg-brand-50 rounded-xl shrink-0">
                  <Home className="w-4 h-4 text-brand-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{property.address}</p>
                  <p className="text-sm text-gray-500">
                    {property.postcode} · {property.propertyType}
                    {(property as any).bedrooms ? ` · ${(property as any).bedrooms} bed` : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {hasFollowUp && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${(property as any).ownershipType === "TENANT" ? "bg-blue-50 text-blue-700" : "bg-green-50 text-green-700"}`}>
                  {(property as any).ownershipType === "TENANT" ? "Tenant" : "Owner"}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-4 text-sm">
              <div>
                <p className="text-xs text-gray-400">Health</p>
                <p className={`font-medium ${health.color}`}>{health.label}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Next visit</p>
                <p className="font-medium text-gray-700">
                  {nextProp
                    ? new Date(nextProp.scheduledAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
                    : "Not scheduled"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Total visits</p>
                <p className="font-medium text-gray-700">{property.visits.length}</p>
              </div>
              <p className="ml-auto text-xs text-brand-600 font-medium">View →</p>
            </div>
          </Link>
        );
      })}
        </div>
      </div>
    </div>
  );
}
