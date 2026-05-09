"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, FileText, LogOut, Settings } from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

type Property = { id: string; address: string };

export default function CustomerSidebar({
  properties,
  name,
  photo,
}: {
  properties: Property[];
  name?: string;
  photo?: string | null;
}) {
  const pathname = usePathname();
  const initial  = (name ?? "C").charAt(0).toUpperCase();

  return (
    <aside className="w-60 min-h-screen bg-white border-r border-gray-200 flex flex-col">
      <div className="px-6 py-5 border-b border-gray-100">
        <span className="text-2xl font-bold text-brand-700">Tennvice</span>
      </div>

      {name && (
        <div className="px-4 py-3 mx-3 mt-3 mb-1 bg-brand-50 rounded-xl">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full overflow-hidden shrink-0">
              {photo ? (
                <img src={photo} alt={name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold">
                  {initial}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
              <p className="text-xs text-brand-600">Customer</p>
            </div>
          </div>
        </div>
      )}

      <nav className="flex-1 px-3 py-4 flex flex-col overflow-y-auto">
        <div className="space-y-1">
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
        </div>

        {/* Account settings + sign out — pinned to bottom of menu */}
        <div className="mt-auto pt-3 border-t border-gray-100 space-y-1">
          <Link
            href="/portal/account"
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              pathname.startsWith("/portal/account") ? "bg-brand-50 text-brand-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <Settings className="w-4 h-4 shrink-0" />
            Account settings
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 w-full transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </nav>
    </aside>
  );
}
