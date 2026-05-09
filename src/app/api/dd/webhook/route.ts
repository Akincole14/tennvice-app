import { NextRequest, NextResponse } from "next/server";
import { verifySignature, InvalidSignatureError } from "gocardless-nodejs";
import { prisma } from "@/lib/prisma";
import { gocardless } from "@/lib/gocardless";
import { SUBSCRIPTION_TIERS } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const body      = await req.text();
  const signature = req.headers.get("webhook-signature") ?? "";
  const secret    = process.env.GOCARDLESS_WEBHOOK_SECRET ?? "";

  try {
    verifySignature(body, secret, signature);
  } catch (e) {
    if (e instanceof InvalidSignatureError) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 498 });
    }
    throw e;
  }

  const { events } = JSON.parse(body) as {
    events: Array<{
      id:            string;
      resource_type: string;
      action:        string;
      links:         Record<string, string>;
    }>;
  };

  for (const event of events) {
    // ── Mandate confirmed ────────────────────────────────────────────────────
    if (event.resource_type === "mandates" && event.action === "created") {
      const mandateId = event.links.mandate;

      const customer = await prisma.customer.findFirst({
        where: { gcMandateId: null, gcBillingRequestId: { not: null } },
      });

      if (customer && !customer.gcMandateId) {
        const tier = SUBSCRIPTION_TIERS[customer.subscriptionTier as keyof typeof SUBSCRIPTION_TIERS];
        const sub  = await gocardless.subscriptions.create({
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
            gcSubscriptionId: sub.id,
            ddStatus:         "ACTIVE",
            ddSetupAt:        new Date(),
          },
        });
      }
    }

    // ── Mandate cancelled / failed ───────────────────────────────────────────
    if (
      event.resource_type === "mandates" &&
      (event.action === "cancelled" || event.action === "failed")
    ) {
      await prisma.customer.updateMany({
        where: { gcMandateId: event.links.mandate },
        data:  { ddStatus: event.action === "cancelled" ? "CANCELLED" : "FAILED" },
      });
    }

    // ── Payment failed → pause subscription ──────────────────────────────────
    if (event.resource_type === "payments" && event.action === "failed") {
      if (event.links.mandate) {
        await prisma.customer.updateMany({
          where: { gcMandateId: event.links.mandate },
          data:  { subscriptionStatus: "PAUSED" },
        });
      }
    }
  }

  return NextResponse.json({ ok: true });
}
