import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, email, phone, password, subscriptionTier, address, postcode, propertyType, bedrooms } =
    await req.json();

  if (!name || !email || !password || !subscriptionTier || !address || !postcode) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const tierDefaults: Record<string, { visitsPerYear: number; emergencyCallouts: number; discountPercent: number }> = {
    BASIC:    { visitsPerYear: 2, emergencyCallouts: 0, discountPercent: 20 },
    STANDARD: { visitsPerYear: 2, emergencyCallouts: 0, discountPercent: 20 },
    PLUS:     { visitsPerYear: 4, emergencyCallouts: 0, discountPercent: 30 },
    PREMIUM:    { visitsPerYear: 4,  emergencyCallouts: 2,         discountPercent: 40 },
    ENTERPRISE: { visitsPerYear: 12, emergencyCallouts: Infinity,  discountPercent: 50 },
  };

  const defaults = tierDefaults[subscriptionTier];
  const passwordHash = await bcrypt.hash(password, 10);

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
          ...defaults,
          properties: {
            create: {
              address,
              postcode,
              propertyType: propertyType || "House",
              bedrooms: bedrooms ? parseInt(bedrooms) : null,
            },
          },
        },
      },
    },
  });

  return NextResponse.json({ id: user.id }, { status: 201 });
}
