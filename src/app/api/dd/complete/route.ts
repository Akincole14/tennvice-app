import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { gocardless } from "@/lib/gocardless";
import { SUBSCRIPTION_TIERS } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const { billingRequestId } = await req.json();
  if (!billingRequestId) {
    return NextResponse.json({ error: "Missing billingRequestId" }, { status: 400 });
  }

  const customer = await prisma.customer.findFirst({
    where: { gcBillingRequestId: billingRequestId },
  });
  if (!customer) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Fetch billing request from GoCardless to get the confirmed mandate ID
  const br = await gocardless.billingRequests.find(billingRequestId);
  const mandateId = (br as any).links?.mandate as string | undefined;

  if (!mandateId) {
    return NextResponse.json({ error: "Mandate not yet confirmed" }, { status: 202 });
  }

  const tier = SUBSCRIPTION_TIERS[customer.subscriptionTier as keyof typeof SUBSCRIPTION_TIERS];

  // Create a GoCardless subscription against the mandate
  const subscription = await gocardless.subscriptions.create({
    amount:        String(Math.round(tier.price * 100)),
    currency:      "GBP",
    name:          `TennVice ${tier.label}`,
    interval_unit: "monthly" as any,
    day_of_month:  "1",
    links:         { mandate: mandateId },
  });

  await prisma.customer.update({
    where: { id: customer.id },
    data: {
      gcMandateId:      mandateId,
      gcSubscriptionId: subscription.id,
      ddStatus:         "ACTIVE",
      ddSetupAt:        new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}
