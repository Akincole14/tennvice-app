import { NextRequest, NextResponse } from "next/server";
import { getMobileUser } from "@/lib/mobileAuth";
import { prisma } from "@/lib/prisma";
import { SUBSCRIPTION_TIERS } from "@/lib/utils";

const TIER_PRICES: Record<string, number> = {
  BASIC: 19, STANDARD: 26, PLUS: 35, PREMIUM: 40, ENTERPRISE: 0,
};

export async function GET(req: NextRequest) {
  const user = getMobileUser(req);
  if (!user || user.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const customer = await prisma.customer.findUnique({
    where: { userId: user.id },
    include: {
      user: { select: { name: true } },
      properties: {
        include: {
          visits: {
            include: {
              technician: { include: { user: { select: { name: true } } } },
            },
            orderBy: { scheduledAt: "desc" },
          },
        },
      },
    },
  });

  if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

  const now = new Date();
  const allVisits = customer.properties.flatMap(p =>
    p.visits.map(v => ({ ...v, propertyAddress: p.address }))
  );

  const nextVisit = allVisits
    .filter(v => v.status === "SCHEDULED" && new Date(v.scheduledAt) >= now)
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0] ?? null;

  const tier = SUBSCRIPTION_TIERS[customer.subscriptionTier as keyof typeof SUBSCRIPTION_TIERS];
  const price = TIER_PRICES[customer.subscriptionTier] ?? tier?.price ?? 0;

  return NextResponse.json({
    name:               customer.user.name,
    subscriptionTier:   customer.subscriptionTier,
    subscriptionStatus: customer.subscriptionStatus,
    tierLabel:          tier?.label ?? customer.subscriptionTier,
    price,
    visitsPerYear:      customer.visitsPerYear,
    completedVisits:    allVisits.filter(v => v.status === "COMPLETED").length,
    upcomingVisits:     allVisits.filter(v => v.status === "SCHEDULED" && new Date(v.scheduledAt) >= now).length,
    propertyCount:      customer.properties.length,
    nextVisit: nextVisit ? {
      id:           nextVisit.id,
      scheduledAt:  nextVisit.scheduledAt,
      type:         nextVisit.type,
      address:      nextVisit.propertyAddress,
      technicianName: nextVisit.technician?.user.name ?? null,
    } : null,
    properties: customer.properties.map(p => ({
      id:      p.id,
      address: p.address,
      postcode: p.postcode,
      visitCount: p.visits.length,
    })),
  });
}
