import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ visitId: string }> }
) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId || (session?.user as any)?.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { visitId } = await params;
  const { scheduledAt, technicianId } = await req.json();

  if (!scheduledAt) {
    return NextResponse.json({ error: "scheduledAt required" }, { status: 400 });
  }

  const newDate = new Date(scheduledAt);
  if (isNaN(newDate.getTime()) || newDate < new Date()) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  // Verify ownership and that the visit is still SCHEDULED
  const visit = await prisma.visit.findUnique({
    where: { id: visitId },
    include: {
      property: {
        include: { customer: { include: { user: { select: { id: true } } } } },
      },
    },
  });

  if (!visit) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (visit.property.customer.user.id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (visit.status !== "SCHEDULED") {
    return NextResponse.json({ error: "Only scheduled visits can be rescheduled" }, { status: 409 });
  }

  // If switching technician, verify it's a real technician
  if (technicianId && technicianId !== visit.technicianId) {
    const tech = await prisma.technician.findUnique({ where: { id: technicianId } });
    if (!tech) return NextResponse.json({ error: "Technician not found" }, { status: 404 });
  }

  const updated = await prisma.visit.update({
    where: { id: visitId },
    data: {
      scheduledAt: newDate,
      ...(technicianId !== undefined ? { technicianId } : {}),
    },
    include: { technician: { include: { user: { select: { name: true } } } } },
  });

  return NextResponse.json({
    id: updated.id,
    scheduledAt: updated.scheduledAt,
    technicianName: updated.technician?.user.name ?? null,
  });
}
