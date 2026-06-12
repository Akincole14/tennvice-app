import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session   = await getServerSession(authOptions);
  const user      = session?.user as any;
  if (user?.role !== "ADMIN") return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const isSenior  = !user?.adminRole || user?.adminRole === "SENIOR";
  if (!isSenior) return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });

  const { id } = await params;
  const {
    name, email, phone, qualification, licenceNumber, newPassword,
    address, nokName, nokPhone, nokRelationship,
  } = await req.json();

  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
  }

  const technician = await prisma.technician.findUnique({
    where: { id },
    include: { user: true },
  });
  if (!technician) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Check email conflict
  if (email !== technician.user.email) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const userUpdate: Record<string, unknown> = {
    name: name.trim(),
    email: email.trim(),
    phone: phone?.trim() || null,
  };
  if (newPassword?.trim()) {
    userUpdate.passwordHash = await bcrypt.hash(newPassword.trim(), 10);
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: technician.userId }, data: userUpdate }),
    prisma.technician.update({
      where: { id },
      data: {
        qualification:   qualification?.trim()   || null,
        licenceNumber:   licenceNumber?.trim()   || null,
        address:         address?.trim()         || null,
        nokName:         nokName?.trim()         || null,
        nokPhone:        nokPhone?.trim()        || null,
        nokRelationship: nokRelationship?.trim() || null,
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
