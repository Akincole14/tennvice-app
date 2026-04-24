import { prisma } from "@/lib/prisma";
import { SUBSCRIPTION_TIERS } from "@/lib/utils";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

async function getCustomerData(userId: string) {
  return prisma.customer.findUnique({
    where: { userId },
    include: {
      properties: {
        include: {
          visits: {
            include: { report: true, technician: { include: { user: { select: { name: true } } } } },
            orderBy: { scheduledAt: "desc" },
            take: 5,
          },
        },
      },
    },
  });
}

export default async function CustomerPortalPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const customer = await getCustomerData((session.user as any).id);
  if (!customer) redirect("/login");

  const tier = SUBSCRIPTION_TIERS[customer.subscriptionTier];

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">My Home</h1>
      <p className="text-gray-500 mb-8">Your TennVice service overview</p>

      {/* Plan card */}
      <div className="bg-brand-600 text-white rounded-2xl p-6 mb-8 flex items-center justify-between">
        <div>
          <p className="text-sm text-brand-100">Current plan</p>
          <p className="text-2xl font-bold">{tier.label}</p>
          <p className="text-brand-100 text-sm mt-1">£{tier.price}/month</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-brand-100">Visits per year</p>
          <p className="text-3xl font-bold">{tier.visitsPerYear}</p>
          {customer.emergencyCallouts > 0 && (
            <p className="text-brand-100 text-sm">{customer.emergencyCallouts} emergency call-outs</p>
          )}
        </div>
      </div>

      {/* Properties & recent visits */}
      {customer.properties.map((property) => (
        <div key={property.id} className="bg-white rounded-2xl border border-gray-200 p-6 mb-5">
          <h2 className="font-semibold text-gray-900 mb-1">{property.address}</h2>
          <p className="text-sm text-gray-500 mb-5">{property.postcode} · {property.propertyType}</p>

          <h3 className="text-sm font-medium text-gray-700 mb-3">Recent visits</h3>
          {property.visits.length === 0 ? (
            <p className="text-sm text-gray-400">No visits yet.</p>
          ) : (
            <div className="space-y-3">
              {property.visits.map((v) => (
                <div key={v.id} className="flex items-center justify-between border border-gray-100 rounded-xl px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(v.scheduledAt).toLocaleDateString("en-GB", {
                        day: "numeric", month: "long", year: "numeric",
                      })}
                    </p>
                    <p className="text-xs text-gray-500">
                      {v.type.replace(/_/g, " ")} · {v.technician?.user.name ?? "Technician TBC"}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    v.status === "COMPLETED" ? "bg-green-100 text-green-700" :
                    v.status === "SCHEDULED" ? "bg-blue-100 text-blue-700" :
                    "bg-gray-100 text-gray-600"
                  }`}>
                    {v.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
