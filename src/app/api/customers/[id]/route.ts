import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any)?.role;
  if (!["ADMIN", "OWNER", "MANAGER"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const clear = body?.clear === true;

  const customer = await prisma.customer.update({
    where: { id },
    data:  { landlordQuoteSentAt: clear ? null : new Date() },
    select: { landlordQuoteSentAt: true },
  });

  return NextResponse.json({ landlordQuoteSentAt: customer.landlordQuoteSentAt });
}
