import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { propertyId, technicianId, scheduledAt, type, isEmergency } = await req.json();

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

  return NextResponse.json({ id: visit.id }, { status: 201 });
}
