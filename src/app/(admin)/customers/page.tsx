import { prisma } from "@/lib/prisma";
import { SUBSCRIPTION_TIERS } from "@/lib/utils";
import CustomersClient from "./CustomersClient";
import SignOutButton from "@/components/SignOutButton";

const TIER_PRICES: Record<string, number> = {
  BASIC: 15, STANDARD: 22, PLUS: 27, PREMIUM: 50, ENTERPRISE: 75,
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
  const customers = await getCustomers();

  const active = customers.filter((c) => c.subscriptionStatus === "ACTIVE");
  const paused = customers.filter((c) => c.subscriptionStatus === "PAUSED");
  const cancelled = customers.filter((c) => c.subscriptionStatus === "CANCELLED");
  const mrr = active.reduce((sum, c) => sum + (TIER_PRICES[c.subscriptionTier] ?? 0), 0);

  // First 3 shown on mobile; all 5 on desktop
  const stats = [
    { label: "Total customers", value: customers.length },
    { label: "Active", value: active.length, color: "text-green-600" },
    { label: "MRR", value: `£${mrr}`, color: "text-emerald-600" },
    { label: "Paused", value: paused.length, color: "text-yellow-600" },
    { label: "Cancelled", value: cancelled.length, color: "text-red-500" },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-5 md:space-y-6 py-4 md:py-8">
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Customers</h1>
        <SignOutButton />
      </div>

      {/* Stats bar — 3 on mobile, all 5 on desktop */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 md:gap-4">
        {stats.map(({ label, value, color }, i) => (
          <div key={label} className={`bg-white rounded-2xl border border-gray-200 px-3 md:px-5 py-3 md:py-4 ${i >= 3 ? "hidden sm:block" : ""}`}>
            <p className={`text-xl md:text-2xl font-bold ${color ?? "text-gray-900"}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <CustomersClient customers={customers} />
    </div>
  );
}
