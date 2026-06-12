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
  const role    = (session?.user as any)?.role;
  const isSenior = !((session?.user as any)?.adminRole) || (session?.user as any)?.adminRole === "SENIOR";

  if (!session || role !== "ADMIN" || !isSenior) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const admin = await prisma.user.findUnique({
    where:  { id, role: "ADMIN" },
    select: { id: true },
  });
  if (!admin) return NextResponse.json({ error: "Not found" }, { status: 404 });

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
    where: { id },
    data:  { image: imageUrl },
  });

  return NextResponse.json({ imageUrl });
}
