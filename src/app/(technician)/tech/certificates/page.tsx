import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import CertificatesClient from "./CertificatesClient";

export default async function TechCertificatesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const userId = (session.user as any).id as string;
  const technician = await prisma.technician.findUnique({
    where: { userId },
    include: {
      certificates: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!technician) redirect("/login");

  const aiEnabled = !!process.env.ANTHROPIC_API_KEY;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Qualifications & certificates</h1>
        <p className="text-gray-500 mt-1">
          Upload your professional certificates. {aiEnabled
            ? "Each document is automatically verified by AI."
            : "AI verification will run once configured."}
        </p>
      </div>
      <CertificatesClient certificates={technician.certificates} aiEnabled={aiEnabled} />
    </div>
  );
}
