import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Star } from "lucide-react";
import ManagersClient from "./ManagersClient";

export default async function OwnerManagersPage() {
  await getServerSession(authOptions);

  const managers = await prisma.user.findMany({
    where:   { role: "MANAGER" },
    select:  { id: true, name: true, email: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const serialised = managers.map(m => ({
    ...m,
    createdAt: m.createdAt.toISOString(),
  }));

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-4 md:py-8">
      <div className="flex items-center gap-2">
        <Star className="w-6 h-6 text-amber-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manager accounts</h1>
          <p className="text-sm text-gray-500">Manage who has manager-level access to Tennvice.</p>
        </div>
      </div>

      <ManagersClient managers={serialised} />
    </div>
  );
}
