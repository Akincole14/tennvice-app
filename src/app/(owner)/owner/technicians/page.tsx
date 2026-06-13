import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import OwnerTechniciansClient from "./OwnerTechniciansClient";
import OwnerSignOutButton from "@/components/OwnerSignOutButton";

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
    <div className="max-w-5xl mx-auto space-y-5 py-4 md:py-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Technicians</h1>
        <OwnerSignOutButton />
      </div>
      <OwnerTechniciansClient technicians={serialised} />
    </div>
  );
}
