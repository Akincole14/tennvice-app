import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getNearbyTechnicians } from "@/lib/assign-technician";

const VISIT_DURATION_MS = 3 * 60 * 60 * 1000; // 3 hours

function isTechBusy(existingVisits: Date[], requestedTime: Date): boolean {
  return existingVisits.some(
    (v) => Math.abs(v.getTime() - requestedTime.getTime()) < VISIT_DURATION_MS
  );
}

async function findNextSlot(technicianId: string, fromDate: Date): Promise<Date | null> {
  const scanEnd = new Date(fromDate);
  scanEnd.setDate(scanEnd.getDate() + 60);

  const booked = await prisma.visit.findMany({
    where: {
      technicianId,
      status: { in: ["SCHEDULED", "IN_PROGRESS"] },
      scheduledAt: { gte: fromDate, lte: scanEnd },
    },
    select: { scheduledAt: true },
  });

  const bookedTimes = booked.map((v) => new Date(v.scheduledAt));
  const cursor = new Date(fromDate);
  cursor.setDate(cursor.getDate() + 1);
  cursor.setHours(0, 0, 0, 0);

  for (let day = 0; day < 60; day++) {
    const dow = cursor.getDay();
    if (dow !== 0 && dow !== 6) {
      for (const [h, m] of [[9, 0], [11, 0], [14, 0]]) {
        const slot = new Date(cursor);
        slot.setHours(h, m, 0, 0);
        if (slot > fromDate && !isTechBusy(bookedTimes, slot)) {
          return slot;
        }
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ visitId: string }> }
) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId || (session?.user as any)?.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { visitId } = await params;
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const time = searchParams.get("time") ?? "09:00";

  if (!date) {
    return NextResponse.json({ error: "date required (YYYY-MM-DD)" }, { status: 400 });
  }

  const requestedTime = new Date(`${date}T${time}:00`);
  if (isNaN(requestedTime.getTime())) {
    return NextResponse.json({ error: "Invalid date or time" }, { status: 400 });
  }

  // Load visit and verify ownership
  const visit = await prisma.visit.findUnique({
    where: { id: visitId },
    include: {
      property: {
        include: { customer: { include: { user: { select: { id: true } } } } },
      },
      technician: { include: { user: { select: { name: true } } } },
    },
  });

  if (!visit) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (visit.property.customer.user.id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const appointed = visit.technician;

  // No technician assigned yet — just return empty
  if (!appointed) {
    return NextResponse.json({
      requestedTime: requestedTime.toISOString(),
      appointed: null,
      alternatives: [],
    });
  }

  // Check if appointed tech is free at the requested time
  const windowStart = new Date(requestedTime.getTime() - VISIT_DURATION_MS);
  const windowEnd = new Date(requestedTime.getTime() + VISIT_DURATION_MS);

  const conflicts = await prisma.visit.findMany({
    where: {
      id: { not: visitId },
      technicianId: appointed.id,
      status: { in: ["SCHEDULED", "IN_PROGRESS"] },
      scheduledAt: { gte: windowStart, lte: windowEnd },
    },
    select: { scheduledAt: true },
  });

  const available = conflicts.length === 0;
  let nextSlot: string | null = null;
  let alternatives: Awaited<ReturnType<typeof getNearbyTechnicians>> = [];

  if (!available) {
    const slot = await findNextSlot(appointed.id, requestedTime);
    nextSlot = slot ? slot.toISOString() : null;

    // Always offer alternatives when the appointed tech isn't free at this time
    alternatives = await getNearbyTechnicians(
      visit.property.postcode,
      [appointed.id]
    );

    // Filter to techs who are free at the requested time
    const availableAlts = await Promise.all(
      alternatives.map(async (alt) => {
        const altConflicts = await prisma.visit.findMany({
          where: {
            technicianId: alt.id,
            status: { in: ["SCHEDULED", "IN_PROGRESS"] },
            scheduledAt: { gte: windowStart, lte: windowEnd },
          },
          select: { id: true },
        });
        return altConflicts.length === 0 ? alt : null;
      })
    );

    alternatives = availableAlts.filter((a): a is NonNullable<typeof a> => a !== null);
  }

  return NextResponse.json({
    requestedTime: requestedTime.toISOString(),
    appointed: {
      id: appointed.id,
      name: appointed.user.name,
      available,
      nextSlot,
    },
    alternatives,
  });
}
