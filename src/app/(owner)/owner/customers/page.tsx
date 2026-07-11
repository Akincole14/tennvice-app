import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import OwnerCustomersClient from "./OwnerCustomersClient";
import OwnerSignOutButton from "@/components/OwnerSignOutButton";
import Link from "next/link";
import { Users, ArrowLeft } from "lucide-react";

const TIER_PRICES: Record<string, number> = {
  BASIC: 19, STANDARD: 26, PLUS: 35, PREMIUM: 40, ENTERPRISE: 0,
};

async function getCustomers() {
  const customers = await prisma.customer.findMany({
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, createdAt: true } },
      properties: {
        select: {
          id: true,
          visits: {
            select: { scheduledAt: true, completedAt: true, status: true },
            orderBy: { scheduledAt: "desc" },
            take: 1,
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return customers.map(c => ({ ...c, userId: c.user.id }));
}

export default async function OwnerCustomersPage() {
  await getServerSession(authOptions);

  const customers = await getCustomers();

  const active    = customers.filter(c => c.subscriptionStatus === "ACTIVE");
  const paused    = customers.filter(c => c.subscriptionStatus === "PAUSED");
  const cancelled = customers.filter(c => c.subscriptionStatus === "CANCELLED");
  const mrr       = active.reduce((sum, c) => sum + (TIER_PRICES[c.subscriptionTier] ?? 0), 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-4 md:py-8">
      <div className="flex items-center justify-between gap-4">
        <Link href="/owner/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </Link>
        <OwnerSignOutButton />
      </div>

      <div>
        <div className="flex items-center gap-2 mb-1">
          <Users className="w-6 h-6 text-brand-600" />
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        </div>
        <p className="text-sm text-gray-500">View and manage all customer accounts and subscriptions.</p>
      </div>

      {/* Stats bar */}
      <div className="grid gap-3 md:gap-4 grid-cols-3 sm:grid-cols-5">
        {[
          { label: "Total customers", value: customers.length,  color: "" },
          { label: "Active",          value: active.length,     color: "text-green-600" },
          { label: "MRR",             value: `£${mrr}`,         color: "text-emerald-600" },
          { label: "Paused",          value: paused.length,     color: "text-yellow-600" },
          { label: "Cancelled",       value: cancelled.length,  color: "text-red-500" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-200 px-3 md:px-5 py-3 md:py-4">
            <p className={`text-xl md:text-2xl font-bold ${color || "text-gray-900"}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <OwnerCustomersClient customers={customers} />
    </div>
  );
}
