import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import SignOutButton from "@/components/SignOutButton";
import AdminsClient from "./AdminsClient";

export default async function AdminsPage() {
  const session   = await getServerSession(authOptions);
  const user      = session?.user as any;
  const adminRole = user?.adminRole ?? null;
  const isSenior  = !adminRole || adminRole === "SENIOR";

  // Only Senior Admins can access this page
  if (!isSenior) redirect("/dashboard");

  const admins = await prisma.user.findMany({
    where:   { role: "ADMIN" },
    select:  { id: true, name: true, email: true, adminRole: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const serialised = admins.map(a => ({
    ...a,
    createdAt: a.createdAt.toISOString(),
  }));

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-4 md:py-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Link>
        </div>
        <SignOutButton />
      </div>

      <div>
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-6 h-6 text-brand-600" />
          <h1 className="text-2xl font-bold text-gray-900">Admin accounts</h1>
        </div>
        <p className="text-sm text-gray-500">Manage who has access to the admin portal and what they can do.</p>
      </div>

      {/* Permission summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          {
            title: "Senior Admin",
            items: ["Full dashboard including revenue", "Add, edit and remove technicians", "Edit property information", "Manage admin accounts"],
            color: "border-brand-200 bg-brand-50",
            labelColor: "text-brand-700",
          },
          {
            title: "Admin",
            items: ["Dashboard (revenue hidden)", "View technicians — no add or edit", "View properties — no editing", "No access to admin accounts"],
            color: "border-gray-200 bg-gray-50",
            labelColor: "text-gray-700",
          },
        ].map(({ title, items, color, labelColor }) => (
          <div key={title} className={`rounded-2xl border p-5 ${color}`}>
            <p className={`text-sm font-semibold mb-3 ${labelColor}`}>{title}</p>
            <ul className="space-y-1.5">
              {items.map(item => (
                <li key={item} className="flex items-start gap-2 text-xs text-gray-600">
                  <span className="mt-0.5 text-gray-400">•</span>{item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <AdminsClient admins={serialised} />
    </div>
  );
}
