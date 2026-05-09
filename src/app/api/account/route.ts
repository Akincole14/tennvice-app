import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const userId = (session.user as any).id as string;
  const body = await req.json();

  if (body.type === "profile") {
    const { name, email, phone } = body;

    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    // Check email isn't already taken by another user
    if (email !== session.user.email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing && existing.id !== userId) {
        return NextResponse.json({ error: "That email address is already in use" }, { status: 409 });
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { name: name.trim(), email: email.trim(), phone: phone?.trim() || null },
      select: { name: true, email: true, phone: true },
    });

    return NextResponse.json(updated);
  }

  if (body.type === "password") {
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Both fields are required" }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.passwordHash) {
      return NextResponse.json({ error: "Unable to change password" }, { status: 400 });
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid request type" }, { status: 400 });
}
