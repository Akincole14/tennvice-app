import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { assignTechnicianToVisit } from "@/lib/assign-technician";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { propertyId, technicianId, scheduledAt, type, isEmergency, autoAssign } = await req.json();

  if (!propertyId || !scheduledAt || !type) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const visit = await prisma.visit.create({
    data: {
      propertyId,
      technicianId: technicianId || null,
      scheduledAt: new Date(scheduledAt),
      type,
      isEmergency: isEmergency ?? false,
      status: "SCHEDULED",
    },
  });

  // Auto-assign nearest qualified technician when no manual assignment
  if (autoAssign && !technicianId) {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { postcode: true },
    });
    if (property?.postcode) {
      const assignment = await assignTechnicianToVisit(visit.id, property.postcode, type).catch(() => null);
      return NextResponse.json(
        {
          id: visit.id,
          technicianName: assignment?.technicianName ?? null,
          distanceMiles: assignment?.distanceMiles ?? null,
          assignmentReason: assignment?.reason ?? null,
        },
        { status: 201 }
      );
    }
  }

  return NextResponse.json({ id: visit.id }, { status: 201 });
}
