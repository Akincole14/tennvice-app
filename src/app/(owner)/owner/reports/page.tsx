import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BarChart3 } from "lucide-react";
import DownloadButton from "./DownloadButton";
import OwnerSignOutButton from "@/components/OwnerSignOutButton";
import { TIER_LABELS } from "@/lib/utils";

const TIER_PRICES: Record<string, number> = {
  BASIC: 19, STANDARD: 26, PLUS: 35, PREMIUM: 40, ENTERPRISE: 0,
};

export default async function OwnerReportsPage() {
  await getServerSession(authOptions);

  const activeCustomers = await prisma.customer.findMany({
    where:  { subscriptionStatus: "ACTIVE" },
    select: { subscriptionTier: true },
  });

  const mrr        = activeCustomers.reduce((sum, c) => sum + (TIER_PRICES[c.subscriptionTier] ?? 0), 0);
  const arr        = mrr * 12;
  const avgRevenue = activeCustomers.length ? Math.round(mrr / activeCustomers.length) : 0;

  const tierBreakdown = await prisma.customer.groupBy({
    by:    ["subscriptionTier"],
    where: { subscriptionStatus: "ACTIVE" },
    _count: true,
  });

  const tierOrder = ["BASIC", "STANDARD", "PLUS", "PREMIUM", "ENTERPRISE"];

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4 md:py-8">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-brand-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
            <p className="text-sm text-gray-500 mt-0.5">Revenue and subscription breakdown</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DownloadButton />
          <OwnerSignOutButton />
        </div>
      </div>

      {/* Revenue summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Monthly Recurring Revenue", value: `£${mrr.toLocaleString()}`, color: "text-emerald-600" },
          { label: "Annual Recurring Revenue",  value: `£${arr.toLocaleString()}`, color: "text-teal-600" },
          { label: "Avg Revenue per Customer",  value: `£${avgRevenue}/mo`,         color: "text-blue-600" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-200 px-5 py-4">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Tier breakdown table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Customers by Plan</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-3 font-medium text-gray-500">Plan</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Monthly Price</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Customers</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Monthly Revenue</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Annual Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tierOrder.map(tier => {
                const row   = tierBreakdown.find(t => t.subscriptionTier === tier);
                const count = row?._count ?? 0;
                const price = TIER_PRICES[tier] ?? 0;
                return (
                  <tr key={tier} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 font-medium text-gray-900">
                      {TIER_LABELS[tier] ?? tier}
                    </td>
                    <td className="px-6 py-3 text-gray-600">£{price}/mo</td>
                    <td className="px-6 py-3 text-gray-700">{count}</td>
                    <td className="px-6 py-3 text-emerald-600 font-medium">£{(count * price).toLocaleString()}</td>
                    <td className="px-6 py-3 text-teal-600 font-medium">£{(count * price * 12).toLocaleString()}</td>
                  </tr>
                );
              })}
              <tr className="bg-gray-50 font-semibold">
                <td className="px-6 py-3 text-gray-900">Total</td>
                <td className="px-6 py-3" />
                <td className="px-6 py-3 text-gray-900">{activeCustomers.length}</td>
                <td className="px-6 py-3 text-emerald-700">£{mrr.toLocaleString()}</td>
                <td className="px-6 py-3 text-teal-700">£{arr.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
