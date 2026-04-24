import { prisma } from "@/lib/prisma";

async function getProperties() {
  return prisma.property.findMany({
    include: {
      customer: { include: { user: { select: { name: true } } } },
      visits: { select: { id: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export default async function PropertiesPage() {
  const properties = await getProperties();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Properties</h1>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-5 py-3 font-medium text-gray-500">Address</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Postcode</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Type</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Customer</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Total visits</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {properties.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-gray-400">
                  No properties added yet.
                </td>
              </tr>
            ) : (
              properties.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-gray-900">{p.address}</td>
                  <td className="px-5 py-3 text-gray-600">{p.postcode}</td>
                  <td className="px-5 py-3 text-gray-600">{p.propertyType}</td>
                  <td className="px-5 py-3 text-gray-600">{p.customer.user.name ?? "—"}</td>
                  <td className="px-5 py-3 text-gray-600">{p.visits.length}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
