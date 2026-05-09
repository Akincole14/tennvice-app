import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

const VALID_STATUSES = ["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];
const VALID_TYPES = ["ROUTINE_PLUMBING", "ROUTINE_ELECTRICAL", "ROUTINE_BOTH", "BOILER_SERVICE", "EMERGENCY"];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session || (role !== "ADMIN" && role !== "TECHNICIAN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { status, technicianId, scheduledAt, type } = body;

  const data: Record<string, unknown> = {};

  if (status !== undefined) {
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    data.status = status;
    if (status === "COMPLETED") data.completedAt = new Date();
  }
  if (technicianId !== undefined) data.technicianId = technicianId || null;
  if (scheduledAt !== undefined) data.scheduledAt = new Date(scheduledAt);
  if (type !== undefined) {
    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }
    data.type = type;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const visit = await prisma.visit.update({ where: { id }, data });

  return NextResponse.json({ id: visit.id });
}
