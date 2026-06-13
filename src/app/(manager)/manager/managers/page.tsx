import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Star } from "lucide-react";
import ManagerSignOutButton from "@/components/ManagerSignOutButton";

export default async function ManagerManagersPage() {
  const session = await getServerSession(authOptions);
  const me      = (session?.user as any)?.id;

  const managers = await prisma.user.findMany({
    where:   { role: "MANAGER" },
    select:  { id: true, name: true, email: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-4 md:py-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Star className="w-6 h-6 text-purple-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manager accounts</h1>
            <p className="text-sm text-gray-500">View all manager-level users.</p>
          </div>
        </div>
        <ManagerSignOutButton />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <span className="text-sm text-gray-500">{managers.length} manager{managers.length !== 1 ? "s" : ""}</span>
        </div>
        {managers.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-gray-400">No manager accounts found.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {managers.map(m => (
              <div key={m.id} className="flex items-center gap-4 px-6 py-4">
                <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm shrink-0">
                  {m.name?.charAt(0)?.toUpperCase() ?? "M"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900 truncate">{m.name ?? "—"}</p>
                    {m.id === me && (
                      <span className="text-[10px] font-bold text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded uppercase tracking-wide">You</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate">{m.email}</p>
                </div>
                <p className="text-xs text-gray-400 hidden sm:block">
                  {new Date(m.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
