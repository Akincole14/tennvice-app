import { prisma } from "@/lib/prisma";
import PropertiesClient from "./PropertiesClient";
import SignOutButton from "@/components/SignOutButton";

async function getProperties() {
  return prisma.property.findMany({
    include: {
      customer: {
        include: { user: { select: { name: true } } },
      },
      visits: {
        select: { id: true, status: true, scheduledAt: true, isEmergency: true },
        orderBy: { scheduledAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export default async function PropertiesPage() {
  const properties = await getProperties();

  const totalVisits = properties.reduce((sum, p) => sum + p.visits.length, 0);
  const withBedroomsData = properties.filter((p) => p.bedrooms != null);
  const avgBedrooms =
    withBedroomsData.length > 0
      ? Math.round(
          withBedroomsData.reduce((sum, p) => sum + (p.bedrooms ?? 0), 0) /
            withBedroomsData.length
        )
      : null;

  const stats = [
    { label: "Total properties", value: properties.length },
    { label: "Total visits", value: totalVisits },
    { label: "Avg bedrooms", value: avgBedrooms ?? "—" },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-4 md:py-8">
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
        <SignOutButton />
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map(({ label, value }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-200 px-5 py-4">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <PropertiesClient properties={properties} />
    </div>
  );
}
