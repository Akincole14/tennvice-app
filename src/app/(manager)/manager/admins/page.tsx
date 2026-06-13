import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ShieldCheck } from "lucide-react";
import ManagerAdminsClient from "./ManagerAdminsClient";

export default async function ManagerAdminsPage() {
  await getServerSession(authOptions);

  const admins = await prisma.user.findMany({
    where:   { role: "ADMIN" },
    select:  { id: true, name: true, email: true, adminRole: true, image: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const serialised = admins.map(a => ({
    ...a,
    createdAt: a.createdAt.toISOString(),
  }));

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-4 md:py-8">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-6 h-6 text-brand-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin accounts</h1>
          <p className="text-sm text-gray-500">View and manage all admin users.</p>
        </div>
      </div>
      <ManagerAdminsClient admins={serialised} />
    </div>
  );
}
