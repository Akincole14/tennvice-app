import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import OwnerTechniciansClient from "./OwnerTechniciansClient";
import OwnerSignOutButton from "@/components/OwnerSignOutButton";
import Link from "next/link";
import { Wrench, ArrowLeft } from "lucide-react";

export default async function OwnerTechniciansPage() {
  await getServerSession(authOptions);

  const technicians = await prisma.technician.findMany({
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, image: true, createdAt: true } },
      visits: { where: { status: { in: ["SCHEDULED", "IN_PROGRESS"] } }, select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const serialised = technicians.map(t => ({
    id:            t.id,
    userId:        t.userId,
    qualification: t.qualification,
    licenceNumber: t.licenceNumber,
    activeVisits:  t.visits.length,
    user: {
      id:        t.user.id,
      name:      t.user.name,
      email:     t.user.email,
      phone:     t.user.phone,
      image:     t.user.image,
      createdAt: t.user.createdAt.toISOString(),
    },
  }));

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4 md:py-8">
      <div className="flex items-center justify-between gap-4">
        <Link href="/owner/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </Link>
        <OwnerSignOutButton />
      </div>

      <div>
        <div className="flex items-center gap-2 mb-1">
          <Wrench className="w-6 h-6 text-brand-600" />
          <h1 className="text-2xl font-bold text-gray-900">Technicians</h1>
        </div>
        <p className="text-sm text-gray-500">Manage technician profiles and monitor their active workload.</p>
      </div>

      <OwnerTechniciansClient technicians={serialised} />
    </div>
  );
}
