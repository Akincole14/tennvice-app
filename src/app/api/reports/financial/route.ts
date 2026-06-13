import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TIER_LABELS } from "@/lib/utils";

const TIER_PRICES: Record<string, number> = {
  BASIC: 19, STANDARD: 26, PLUS: 35, PREMIUM: 40, ENTERPRISE: 0,
};

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const customers = await prisma.customer.findMany({
    include: { user: { select: { name: true, email: true, createdAt: true } } },
    orderBy: { createdAt: "desc" },
  });

  const rows = [
    ["Name", "Email", "Plan", "Monthly Price (£)", "Status", "Member Since"],
    ...customers.map(c => [
      c.user.name ?? "",
      c.user.email ?? "",
      TIER_LABELS[c.subscriptionTier] ?? c.subscriptionTier,
      String(TIER_PRICES[c.subscriptionTier] ?? 0),
      c.subscriptionStatus,
      new Date(c.user.createdAt).toLocaleDateString("en-GB"),
    ]),
  ];

  const mrr = customers
    .filter(c => c.subscriptionStatus === "ACTIVE")
    .reduce((sum, c) => sum + (TIER_PRICES[c.subscriptionTier] ?? 0), 0);

  rows.push([], ["", "", "", "", "", ""], ["Total MRR (£)", String(mrr)], ["Total ARR (£)", String(mrr * 12)]);

  const csv = rows.map(r => r.map(v => `"${v.replace(/"/g, '""')}"`).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="tennvice-financial-report-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
