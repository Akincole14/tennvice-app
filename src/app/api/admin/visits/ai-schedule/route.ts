import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";
import { assignTechnicianToVisit } from "@/lib/assign-technician";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { propertyId } = await req.json();
  if (!propertyId) {
    return NextResponse.json({ error: "propertyId required" }, { status: 400 });
  }

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    include: {
      customer: {
        select: { visitsPerYear: true },
      },
      visits: {
        where: { status: { in: ["SCHEDULED", "IN_PROGRESS", "COMPLETED"] } },
        select: { scheduledAt: true, status: true, type: true },
        orderBy: { scheduledAt: "asc" },
      },
    },
  });

  if (!property) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  const visitsPerYear = property.customer.visitsPerYear;
  const today = new Date();
  const yearEnd = new Date(today.getFullYear(), 11, 31);

  const existingVisits = property.visits.map((v) => ({
    date: new Date(v.scheduledAt).toISOString().split("T")[0],
    status: v.status,
    type: v.type,
  }));

  const scheduledCount = property.visits.filter(
    (v) => v.status === "SCHEDULED" && new Date(v.scheduledAt) >= today
  ).length;
  const completedThisYear = property.visits.filter((v) => {
    const d = new Date(v.scheduledAt);
    return v.status === "COMPLETED" && d.getFullYear() === today.getFullYear();
  }).length;

  const remainingVisits = visitsPerYear - completedThisYear - scheduledCount;
  if (remainingVisits <= 0) {
    return NextResponse.json(
      { message: "All visits for this year are already scheduled or completed.", visits: [] },
      { status: 200 }
    );
  }

  const prompt = `You are scheduling home maintenance visits for a customer.

Plan details:
- Visits per year: ${visitsPerYear}
- Today: ${today.toISOString().split("T")[0]}
- Year end: ${yearEnd.toISOString().split("T")[0]}
- Visits already scheduled or completed this year: ${visitsPerYear - remainingVisits}
- Remaining visits to schedule: ${remainingVisits}
- Existing visits: ${JSON.stringify(existingVisits)}

Rules:
1. Space visits as evenly as possible through the remaining months of the year.
2. Do not schedule on weekends (Saturday = 6, Sunday = 0).
3. Do not schedule visits less than 14 days apart.
4. Do not schedule on any dates that already have a visit.
5. Schedule visits on weekdays only, targeting the middle of each available period.
6. Return ONLY a JSON array of objects. Nothing else — no prose, no markdown.
   Each object: { "date": "YYYY-MM-DD", "type": "ROUTINE_BOTH" }

Respond with exactly the JSON array for ${remainingVisits} visit(s).`;

  let suggestedDates: { date: string; type: string }[];
  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await anthropic.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 8000,
      thinking: { type: "adaptive" },
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "AI returned no text" }, { status: 500 });
    }

    const raw = textBlock.text.trim().replace(/^```(?:json)?|```$/gm, "").trim();
    suggestedDates = JSON.parse(raw);
    if (!Array.isArray(suggestedDates)) throw new Error("AI response was not a JSON array");
  } catch (err: any) {
    console.error("[admin/ai-schedule] error:", err?.message ?? err);
    return NextResponse.json(
      { error: err?.message ?? "AI scheduling failed" },
      { status: 500 }
    );
  }

  const created = await Promise.all(
    suggestedDates.map(({ date, type }) =>
      prisma.visit.create({
        data: {
          propertyId,
          scheduledAt: new Date(`${date}T10:00:00.000Z`),
          type: type ?? "ROUTINE_BOTH",
          status: "SCHEDULED",
          isEmergency: false,
        },
      })
    )
  );

  // Assign a technician to all created visits
  const assignment = created.length > 0
    ? await assignTechnicianToVisit(
        created[0].id,
        property.postcode,
        suggestedDates[0]?.type ?? "ROUTINE_BOTH"
      ).catch(() => ({ technicianId: null, technicianName: null, distanceMiles: null, reason: "Assignment pending" }))
    : null;

  if (assignment?.technicianId && created.length > 1) {
    await Promise.all(
      created.slice(1).map((v) =>
        prisma.visit.update({ where: { id: v.id }, data: { technicianId: assignment.technicianId } })
      )
    );
  }

  return NextResponse.json(
    {
      message: `${created.length} visit${created.length !== 1 ? "s" : ""} scheduled by AI.`,
      visits: suggestedDates.map((v) => ({ ...v })),
      technicianName: assignment?.technicianName ?? null,
      assignmentReason: assignment?.reason ?? null,
    },
    { status: 201 }
  );
}
