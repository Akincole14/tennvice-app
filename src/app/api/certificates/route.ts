import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { analyzeCertificate } from "@/lib/anthropic";
import { writeFile } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg":      ".jpg",
  "image/png":       ".png",
  "image/webp":      ".webp",
  "application/pdf": ".pdf",
};

const MAX_BYTES = 10 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role    = (session?.user as any)?.role;
  const userId  = (session?.user as any)?.id as string | undefined;

  if (!session || (role !== "TECHNICIAN" && role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const formData = await req.formData();
  const file     = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Resolve technician
  let technician: { id: string } | null = null;
  if (role === "TECHNICIAN") {
    technician = await prisma.technician.findUnique({ where: { userId } });
  } else {
    const tid = formData.get("technicianId") as string | null;
    if (!tid) return NextResponse.json({ error: "technicianId required" }, { status: 400 });
    technician = await prisma.technician.findUnique({ where: { id: tid } });
  }

  if (!technician) return NextResponse.json({ error: "Technician not found" }, { status: 404 });

  const mimeType = file.type;
  if (!ALLOWED_TYPES[mimeType]) {
    return NextResponse.json({ error: "Only JPEG, PNG, WebP and PDF files are accepted" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File must be under 10 MB" }, { status: 400 });
  }

  const ext      = ALLOWED_TYPES[mimeType];
  const safeName = `${randomUUID()}${ext}`;
  const diskPath = join(process.cwd(), "public", "uploads", "certificates", safeName);
  const fileUrl  = `/uploads/certificates/${safeName}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(diskPath, buffer);

  // AI analysis — returns null if key not yet configured
  const ai = await analyzeCertificate(buffer.toString("base64"), mimeType as any).catch(() => null);

  const cert = await prisma.technicianCertificate.create({
    data: {
      technicianId: technician.id,
      fileName:     file.name,
      fileUrl,
      fileType:     mimeType,
      ...(ai ? {
        aiCertName:   ai.certName,
        aiIssuer:     ai.issuer,
        aiHolder:     ai.holder,
        aiLicenceNo:  ai.licenceNo,
        aiIssuedAt:   ai.issuedAt,
        aiExpiresAt:  ai.expiresAt,
        aiSummary:    ai.summary,
        aiConfidence: ai.confidence,
        aiValid:      ai.isValid,
      } : {}),
    },
  });

  return NextResponse.json(cert, { status: 201 });
}
