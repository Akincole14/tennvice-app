import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import { join } from "path";

// Admin: update status (VERIFIED | REJECTED)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { id } = await params;
  const { status } = await req.json();

  if (!["VERIFIED", "REJECTED", "PENDING"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const cert = await prisma.technicianCertificate.update({
    where: { id },
    data: { status },
  });

  return NextResponse.json(cert);
}

// Technician or admin: delete a certificate
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const role    = (session?.user as any)?.role;
  const userId  = (session?.user as any)?.id as string | undefined;

  if (!session || (role !== "TECHNICIAN" && role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { id } = await params;
  const cert = await prisma.technicianCertificate.findUnique({
    where: { id },
    include: { technician: { select: { userId: true } } },
  });
  if (!cert) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Technicians can only delete their own certificates
  if (role === "TECHNICIAN" && cert.technician.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Remove file from disk
  const diskPath = join(process.cwd(), "public", cert.fileUrl);
  await unlink(diskPath).catch(() => null);

  await prisma.technicianCertificate.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
