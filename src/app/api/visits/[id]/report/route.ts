import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session || (role !== "ADMIN" && role !== "TECHNICIAN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const data = await req.json();

  const report = await prisma.report.upsert({
    where: { visitId: id },
    update: { ...data },
    create: { visitId: id, ...data },
  });

  if (data.signedByTechnician) {
    await prisma.visit.update({
      where: { id },
      data: { status: "COMPLETED", completedAt: new Date() },
    });
  }

  return NextResponse.json({ id: report.id });
}
