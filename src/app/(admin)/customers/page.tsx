import { prisma } from "@/lib/prisma";
import { SUBSCRIPTION_TIERS } from "@/lib/utils";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import CustomersClient from "./CustomersClient";
import SignOutButton from "@/components/SignOutButton";

const TIER_PRICES: Record<string, number> = {
  BASIC: 19, STANDARD: 26, PLUS: 35, PREMIUM: 40, ENTERPRISE: 0,
};

async function getCustomers() {
  return prisma.customer.findMany({
    include: {
      user: { select: { name: true, email: true, phone: true, createdAt: true } },
      properties: {
        select: {
          id: true,
          visits: {
            select: { scheduledAt: true, completedAt: true, status: true },
            orderBy: { scheduledAt: "desc" },
            take: 1,
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export default async function CustomersPage() {
  const session  = await getServerSession(authOptions);
  const adminRole = (session?.user as any)?.adminRole ?? null;
  const isSenior  = !adminRole || adminRole === "SENIOR";

  const customers = await getCustomers();

  const active = customers.filter((c) => c.subscriptionStatus === "ACTIVE");
  const paused = customers.filter((c) => c.subscriptionStatus === "PAUSED");
  const cancelled = customers.filter((c) => c.subscriptionStatus === "CANCELLED");
  const mrr = active.reduce((sum, c) => sum + (TIER_PRICES[c.subscriptionTier] ?? 0), 0);

  const allStats = [
    { label: "Total customers", value: customers.length,        color: "",                  seniorOnly: false },
    { label: "Active",          value: active.length,           color: "text-green-600",    seniorOnly: false },
    { label: "MRR",             value: `£${mrr}`,               color: "text-emerald-600",  seniorOnly: true  },
    { label: "Paused",          value: paused.length,           color: "text-yellow-600",   seniorOnly: false },
    { label: "Cancelled",       value: cancelled.length,        color: "text-red-500",      seniorOnly: false },
  ];
  const stats = allStats.filter(s => isSenior || !s.seniorOnly);

  return (
    <div className="max-w-6xl mx-auto space-y-5 md:space-y-6 py-4 md:py-8">
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Customers</h1>
        <SignOutButton />
      </div>

      {/* Stats bar */}
      <div className={`grid gap-3 md:gap-4 ${isSenior ? "grid-cols-3 sm:grid-cols-5" : "grid-cols-2 sm:grid-cols-4"}`}>
        {stats.map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-200 px-3 md:px-5 py-3 md:py-4">
            <p className={`text-xl md:text-2xl font-bold ${color || "text-gray-900"}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <CustomersClient customers={customers} isSenior={isSenior} />
    </div>
  );
}
