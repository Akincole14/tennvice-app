import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { SUBSCRIPTION_TIERS } from "@/lib/utils";
import { gocardless, isGoCardlessConfigured } from "@/lib/gocardless";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const {
    name, email, phone, password,
    address, postcode, propertyType, ownershipType, bedrooms,
    subscriptionTier,
  } = body;

  // ── Validation ────────────────────────────────────────────────────────────
  if (!name || !email || !password || !address || !postcode || !subscriptionTier) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }
  if (!Object.keys(SUBSCRIPTION_TIERS).includes(subscriptionTier)) {
    return NextResponse.json({ error: "Invalid subscription tier" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  }

  const tier         = SUBSCRIPTION_TIERS[subscriptionTier as keyof typeof SUBSCRIPTION_TIERS];
  const passwordHash = await bcrypt.hash(password, 10);

  // ── Create user + customer + property ─────────────────────────────────────
  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone: phone || null,
      passwordHash,
      role: "CUSTOMER",
      customer: {
        create: {
          subscriptionTier,
          subscriptionStatus: "ACTIVE",
          visitsPerYear:     tier.visitsPerYear,
          emergencyCallouts: tier.emergencyCallouts === Infinity ? 999 : tier.emergencyCallouts,
          discountPercent:   tier.discount,
          ddStatus:          "PENDING",
          properties: {
            create: {
              address,
              postcode,
              propertyType:  propertyType  || "House",
              ownershipType: ownershipType || "OWNER",
              bedrooms:      bedrooms ? parseInt(bedrooms) : null,
            },
          },
        },
      },
    },
    select: { id: true, customer: { select: { id: true } } },
  });

  const customerId = user.customer!.id;
  const baseUrl    = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  // ── GoCardless billing request ────────────────────────────────────────────
  if (!isGoCardlessConfigured()) {
    // Dev fallback: skip GoCardless, mark dd as pending, return login URL
    return NextResponse.json({ redirectUrl: "/login?registered=1" }, { status: 201 });
  }

  const [firstName, ...rest] = name.trim().split(" ");
  const lastName = rest.join(" ") || "-";

  const billingRequest = await gocardless.billingRequests.create({
    mandate_request: {
      scheme:      "bacs",
      currency:    "GBP",
      description: `Tennvice ${tier.label} subscription`,
    },
    metadata: {
      customerId,
      subscriptionTier,
    },
  });

  const flow = await gocardless.billingRequestFlows.create({
    redirect_uri: `${baseUrl}/register/dd-success`,
    exit_uri:     `${baseUrl}/register/dd-cancelled`,
    links:        { billing_request: billingRequest.id },
    prefilled_customer: {
      email,
      given_name:  firstName,
      family_name: lastName,
    },
  });

  // Store billing request ID so we can look up the mandate on return
  await prisma.customer.update({
    where: { id: customerId },
    data:  { gcBillingRequestId: billingRequest.id },
  });

  return NextResponse.json(
    { redirectUrl: flow.authorisation_url },
    { status: 201 }
  );
}
