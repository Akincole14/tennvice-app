import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const session  = await getServerSession(authOptions);
  const user     = session?.user as any;
  if (user?.role !== "ADMIN") return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const isSenior = !user?.adminRole || user?.adminRole === "SENIOR";
  if (!isSenior) return NextResponse.json({ error: "Only Senior Admins can create admin accounts" }, { status: 403 });

  const { name, email, password, adminRole } = await req.json();

  if (!name?.trim() || !email?.trim() || !password?.trim()) {
    return NextResponse.json({ error: "Name, email and password are required" }, { status: 400 });
  }
  if (!["SENIOR", "STANDARD"].includes(adminRole)) {
    return NextResponse.json({ error: "Invalid admin role" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: email.trim() } });
  if (existing) return NextResponse.json({ error: "A user with that email already exists" }, { status: 409 });

  const passwordHash = await bcrypt.hash(password, 10);

  const newUser = await prisma.user.create({
    data: {
      name:  name.trim(),
      email: email.trim(),
      passwordHash,
      role:      "ADMIN",
      adminRole: adminRole,
    },
  });

  return NextResponse.json(newUser, { status: 201 });
}
