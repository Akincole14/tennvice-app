"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, FileText, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

type Property = { id: string; address: string };

export default function CustomerSidebar({ properties }: { properties: Property[] }) {
  const pathname = usePathname();

  return (
    <aside className="w-60 min-h-screen bg-white border-r border-gray-200 flex flex-col">
      <div className="px-6 py-5 border-b border-gray-100">
        <span className="text-2xl font-bold text-brand-700">TennVice</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {/* Overview */}
        <Link
          href="/portal"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
            pathname === "/portal" ? "bg-brand-50 text-brand-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          )}
        >
          <Home className="w-4 h-4 shrink-0" />
          My Home
        </Link>

        {/* Properties */}
        {properties.length > 0 && (
          <div className="pt-3">
            <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Properties</p>
            {properties.map((p) => {
              const href = `/portal/properties/${p.id}`;
              return (
                <Link
                  key={p.id}
                  href={href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    pathname === href ? "bg-brand-50 text-brand-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0 ml-1" />
                  <span className="truncate">{p.address.split(",")[0]}</span>
                </Link>
              );
            })}
          </div>
        )}

        {/* Visit history */}
        <div className="pt-3">
          <Link
            href="/portal/visits"
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              pathname.startsWith("/portal/visits") ? "bg-brand-50 text-brand-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <FileText className="w-4 h-4 shrink-0" />
            Visit History
          </Link>
        </div>
      </nav>

      <div className="px-3 py-4 border-t border-gray-100">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 w-full transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
