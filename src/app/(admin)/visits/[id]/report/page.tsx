import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ReportForm from "./ReportForm";

export default async function ReportPage({ params }: { params: { id: string } }) {
  const visit = await prisma.visit.findUnique({
    where: { id: params.id },
    include: {
      property: {
        include: { customer: { include: { user: { select: { name: true } } } } },
      },
      technician: { include: { user: { select: { name: true } } } },
    },
  });

  if (!visit) notFound();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Visit report</h1>
        <p className="text-gray-500 mt-1">
          {visit.property.address} · {visit.property.customer.user.name ?? "Unknown customer"} ·{" "}
          {new Date(visit.scheduledAt).toLocaleDateString("en-GB", {
            day: "numeric", month: "long", year: "numeric",
          })}
        </p>
      </div>
      <ReportForm visitId={visit.id} />
    </div>
  );
}
