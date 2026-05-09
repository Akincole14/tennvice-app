import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png":  "png",
  "image/webp": "webp",
};

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const role          = (session?.user as any)?.role;
  const sessionUserId = (session?.user as any)?.id;

  if (!session || (role !== "ADMIN" && role !== "TECHNICIAN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const technician = await prisma.technician.findUnique({
    where: { id },
    select: { id: true, userId: true },
  });
  if (!technician) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (role === "TECHNICIAN" && technician.userId !== sessionUserId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const fd   = await req.formData();
  const file = fd.get("photo") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const ext = ALLOWED[file.type];
  if (!ext) return NextResponse.json({ error: "Only JPEG, PNG and WebP images are allowed" }, { status: 400 });

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "File must be under 5 MB" }, { status: 400 });
  }

  const filename = `${randomUUID()}.${ext}`;
  const dir = join(process.cwd(), "public", "uploads", "avatars");
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, filename), Buffer.from(await file.arrayBuffer()));

  const imageUrl = `/uploads/avatars/${filename}`;

  await prisma.user.update({
    where: { id: technician.userId },
    data:  { image: imageUrl },
  });

  return NextResponse.json({ imageUrl });
}
