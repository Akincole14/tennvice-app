import { prisma } from "@/lib/prisma";
import { SUBSCRIPTION_TIERS } from "@/lib/utils";

async function getCustomers() {
  return prisma.customer.findMany({
    include: {
      user: { select: { name: true, email: true, phone: true } },
      properties: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

const tierColors: Record<string, string> = {
  BASIC:    "bg-gray-100 text-gray-700",
  STANDARD: "bg-blue-100 text-blue-700",
  PLUS:     "bg-purple-100 text-purple-700",
  PREMIUM:  "bg-amber-100 text-amber-700",
};

const statusColors: Record<string, string> = {
  ACTIVE:    "bg-green-100 text-green-700",
  PAUSED:    "bg-yellow-100 text-yellow-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export default async function CustomersPage() {
  const customers = await getCustomers();

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-5 py-3 font-medium text-gray-500">Name</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Email</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Plan</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Status</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Properties</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {customers.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-gray-400">
                  No customers yet.
                </td>
              </tr>
            ) : (
              customers.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-gray-900">{c.user.name ?? "—"}</td>
                  <td className="px-5 py-3 text-gray-600">{c.user.email}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tierColors[c.subscriptionTier]}`}>
                      {SUBSCRIPTION_TIERS[c.subscriptionTier].label} — £{SUBSCRIPTION_TIERS[c.subscriptionTier].price}/mo
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[c.subscriptionStatus]}`}>
                      {c.subscriptionStatus}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{c.properties.length}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
