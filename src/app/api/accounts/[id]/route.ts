import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const actor   = session?.user as any;

  const isOwner   = actor?.role === "OWNER";
  const isManager = actor?.role === "MANAGER";

  if (!session || (!isOwner && !isManager)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  if (id === actor.id) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true } });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (target.role === "OWNER") {
    return NextResponse.json({ error: "Cannot delete an Owner account" }, { status: 403 });
  }

  // Managers cannot delete other manager accounts
  if (isManager && target.role === "MANAGER") {
    return NextResponse.json({ error: "Managers cannot delete other manager accounts" }, { status: 403 });
  }

  // Nullify visits assigned to this technician before deleting
  if (target.role === "TECHNICIAN") {
    const technician = await prisma.technician.findUnique({
      where: { userId: id },
      select: { id: true },
    });
    if (technician) {
      await prisma.visit.updateMany({
        where: { technicianId: technician.id },
        data:  { technicianId: null },
      });
    }
  }

  await prisma.user.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
