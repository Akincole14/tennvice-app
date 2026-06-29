import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { assignTechnicianToVisit } from "@/lib/assign-technician";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId || (session?.user as any)?.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { propertyId, type, scheduledAt } = await req.json();

  if (!propertyId || !type || !scheduledAt) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const customer = await prisma.customer.findUnique({
    where: { userId },
    include: { properties: { select: { id: true, postcode: true } } },
  });

  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  const property = customer.properties.find((p) => p.id === propertyId);
  if (!property) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  const date = new Date(scheduledAt);
  if (isNaN(date.getTime()) || date < new Date()) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const visit = await prisma.visit.create({
    data: {
      propertyId,
      scheduledAt: date,
      type,
      status: "SCHEDULED",
      isEmergency: type === "EMERGENCY",
    },
  });

  const assignment = await assignTechnicianToVisit(visit.id, property.postcode, type).catch(
    () => ({ technicianId: null, technicianName: null, distanceMiles: null, reason: "Assignment pending" })
  );

  return NextResponse.json(
    { id: visit.id, technicianName: assignment.technicianName, distanceMiles: assignment.distanceMiles, assignmentReason: assignment.reason },
    { status: 201 }
  );
}
