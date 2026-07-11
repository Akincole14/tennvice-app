import { NextRequest, NextResponse } from "next/server";
import { getMobileUser } from "@/lib/mobileAuth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const user = getMobileUser(req);
  if (!user || user.role !== "TECHNICIAN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const technician = await prisma.technician.findUnique({
    where: { userId: user.id },
    include: {
      visits: {
        include: {
          property: {
            include: { customer: { include: { user: { select: { name: true, phone: true } } } } },
          },
          report: { select: { signedByTechnician: true } },
        },
        orderBy: { scheduledAt: "asc" },
      },
    },
  });

  if (!technician) return NextResponse.json({ error: "Technician not found" }, { status: 404 });

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const weekEnd = new Date(today); weekEnd.setDate(weekEnd.getDate() + 7);

  const todayVisits = technician.visits.filter(v =>
    new Date(v.scheduledAt) >= today && new Date(v.scheduledAt) < tomorrow && v.status !== "CANCELLED"
  );
  const upcomingVisits = technician.visits.filter(v =>
    new Date(v.scheduledAt) >= tomorrow && new Date(v.scheduledAt) <= weekEnd && v.status !== "CANCELLED"
  );

  const formatVisit = (v: typeof technician.visits[0]) => ({
    id:          v.id,
    scheduledAt: v.scheduledAt,
    type:        v.type,
    status:      v.status,
    address:     v.property.address,
    customerName: v.property.customer?.user.name ?? null,
    customerPhone: v.property.customer?.user.phone ?? null,
  });

  return NextResponse.json({
    name:          user.name,
    totalAssigned: technician.visits.filter(v => v.status !== "CANCELLED").length,
    completed:     technician.visits.filter(v => v.status === "COMPLETED").length,
    pendingReports: technician.visits.filter(v => v.status === "COMPLETED" && v.report && !v.report.signedByTechnician).length,
    todayVisits:    todayVisits.map(formatVisit),
    upcomingVisits: upcomingVisits.map(formatVisit),
    activeVisit:    technician.visits.find(v => v.status === "IN_PROGRESS") ? formatVisit(technician.visits.find(v => v.status === "IN_PROGRESS")!) : null,
  });
}
