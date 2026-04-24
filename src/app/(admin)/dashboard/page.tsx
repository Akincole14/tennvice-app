import { prisma } from "@/lib/prisma";
import { Users, Home, Calendar, AlertCircle } from "lucide-react";

async function getStats() {
  const [customers, properties, upcomingVisits, pendingReports] = await Promise.all([
    prisma.customer.count({ where: { subscriptionStatus: "ACTIVE" } }),
    prisma.property.count(),
    prisma.visit.count({
      where: { status: "SCHEDULED", scheduledAt: { gte: new Date() } },
    }),
    prisma.visit.count({
      where: { status: "COMPLETED", report: { signedByTechnician: false } },
    }),
  ]);
  return { customers, properties, upcomingVisits, pendingReports };
}

export default async function DashboardPage() {
  const stats = await getStats();

  const cards = [
    { label: "Active customers", value: stats.customers, icon: Users, color: "text-blue-600 bg-blue-50" },
    { label: "Properties", value: stats.properties, icon: Home, color: "text-green-600 bg-green-50" },
    { label: "Upcoming visits", value: stats.upcomingVisits, icon: Calendar, color: "text-purple-600 bg-purple-50" },
    { label: "Unsigned reports", value: stats.pendingReports, icon: AlertCircle, color: "text-amber-600 bg-amber-50" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-200 p-6 flex items-center gap-4">
            <div className={`p-3 rounded-xl ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-sm text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
