import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const session   = await getServerSession(authOptions);
  const user      = session?.user as any;
  if (user?.role !== "ADMIN") return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const adminRole = user?.adminRole ?? null;
  const isSenior  = !adminRole || adminRole === "SENIOR";
  if (!isSenior) return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });

  const {
    name, email, phone, password, qualification, licenceNumber,
    address, nokName, nokPhone, nokRelationship,
  } = await req.json();

  if (!name?.trim() || !email?.trim() || !password?.trim()) {
    return NextResponse.json({ error: "Name, email and password are required" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "A user with that email already exists" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const newUser = await prisma.user.create({
    data: {
      name: name.trim(),
      email: email.trim(),
      phone: phone?.trim() || null,
      passwordHash,
      role: "TECHNICIAN",
      technician: {
        create: {
          qualification:   qualification?.trim()   || null,
          licenceNumber:   licenceNumber?.trim()   || null,
          address:         address?.trim()         || null,
          nokName:         nokName?.trim()         || null,
          nokPhone:        nokPhone?.trim()        || null,
          nokRelationship: nokRelationship?.trim() || null,
        },
      },
    },
    include: { technician: true },
  });

  return NextResponse.json(newUser, { status: 201 });
}
