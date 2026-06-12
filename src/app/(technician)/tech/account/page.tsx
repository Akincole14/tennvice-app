import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import AccountClient from "@/app/(customer)/portal/account/AccountClient";
import PhotoUpload from "./PhotoUpload";
import SignOutButton from "@/components/SignOutButton";

export default async function TechAccountPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const userId = (session.user as any).id as string;

  const [user, technician] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, phone: true, image: true },
    }),
    prisma.technician.findUnique({
      where: { userId },
      select: { id: true },
    }),
  ]);

  if (!user || !technician) redirect("/login");

  return (
    <div className="max-w-xl mx-auto space-y-6 py-4 md:py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Account settings</h1>
          <p className="text-gray-500 mt-1">Update your profile photo, personal details and password</p>
        </div>
        <SignOutButton />
      </div>

      <PhotoUpload
        technicianId={technician.id}
        name={user.name ?? ""}
        currentPhoto={user.image ?? null}
      />

      <AccountClient user={{ name: user.name ?? "", email: user.email ?? "", phone: user.phone }} />
    </div>
  );
}
