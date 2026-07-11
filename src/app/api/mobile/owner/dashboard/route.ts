import { NextRequest, NextResponse } from "next/server";
import { getMobileUser } from "@/lib/mobileAuth";
import { prisma } from "@/lib/prisma";

const TIER_PRICES: Record<string, number> = {
  BASIC: 19, STANDARD: 26, PLUS: 35, PREMIUM: 40, ENTERPRISE: 0,
};

export async function GET(req: NextRequest) {
  const user = getMobileUser(req);
  if (!user || user.role !== "OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay());
  const weekEnd   = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [activeCustomers, propertyCount, visitsThisWeek, completedThisMonth, unassigned, newThisMonth] = await Promise.all([
    prisma.customer.findMany({ where: { subscriptionStatus: "ACTIVE" }, select: { subscriptionTier: true } }),
    prisma.property.count(),
    prisma.visit.count({ where: { scheduledAt: { gte: weekStart, lt: weekEnd } } }),
    prisma.visit.count({ where: { status: "COMPLETED", completedAt: { gte: monthStart } } }),
    prisma.visit.count({ where: { status: "SCHEDULED", scheduledAt: { gte: now }, technicianId: null } }),
    prisma.customer.count({ where: { createdAt: { gte: monthStart } } }),
  ]);

  const mrr = activeCustomers.reduce((sum, c) => sum + (TIER_PRICES[c.subscriptionTier] ?? 0), 0);

  return NextResponse.json({
    name:             user.name,
    activeCustomers:  activeCustomers.length,
    mrr,
    arr:              mrr * 12,
    propertyCount,
    visitsThisWeek,
    completedThisMonth,
    unassignedVisits: unassigned,
    newThisMonth,
  });
}
