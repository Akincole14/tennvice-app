import { prisma } from "@/lib/prisma";
import ReportsClient from "./ReportsClient";
import SignOutButton from "@/components/SignOutButton";

export default async function ReportsPage() {
  const [visits, technicians] = await Promise.all([
    prisma.visit.findMany({
      include: {
        property: {
          include: { customer: { include: { user: { select: { name: true } } } } },
        },
        technician: { select: { id: true, user: { select: { name: true } } } },
        report: { select: { id: true, signedByTechnician: true, followUpRequired: true } },
      },
      orderBy: { scheduledAt: "desc" },
    }),
    prisma.technician.findMany({
      select: { id: true, user: { select: { name: true } } },
    }),
  ]);

  const stats = {
    needsReport:  visits.filter(v => !v.report && (v.status === "COMPLETED" || v.status === "IN_PROGRESS")).length,
    unsignedDrafts: visits.filter(v => v.report && !v.report.signedByTechnician).length,
    signed:       visits.filter(v => v.report?.signedByTechnician).length,
    followUps:    visits.filter(v => v.report?.followUpRequired).length,
  };

  return (
    <div className="max-w-6xl mx-auto space-y-5 md:space-y-6 py-4 md:py-8">
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Reports</h1>
        <SignOutButton />
      </div>
      <ReportsClient visits={visits} technicians={technicians} stats={stats} />
    </div>
  );
}
