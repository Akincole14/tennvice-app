import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import AdminPhotoUpload from "./AdminPhotoUpload";
import AccountClient from "@/app/(customer)/portal/account/AccountClient";

export default async function AdminAccountPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const userId = (session.user as any).id as string;

  const user = await prisma.user.findUnique({
    where:  { id: userId },
    select: { name: true, email: true, phone: true, image: true },
  });

  if (!user) redirect("/login");

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My account</h1>
        <p className="text-gray-500 mt-1">Update your profile photo, personal details and password</p>
      </div>

      <AdminPhotoUpload
        name={user.name ?? ""}
        currentPhoto={user.image ?? null}
      />

      <AccountClient user={{ name: user.name ?? "", email: user.email ?? "", phone: user.phone }} />
    </div>
  );
}
