"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Wrench, ShieldCheck, Star, BarChart3, ClipboardList, Settings, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

const ownerNav = [
  { href: "/owner/dashboard",    label: "Dashboard",          icon: LayoutDashboard },
  { href: "/owner/customers",    label: "Customers",          icon: Users },
  { href: "/owner/technicians",  label: "Technicians",        icon: Wrench },
  { href: "/owner/admins",       label: "Admins",             icon: ShieldCheck },
  { href: "/owner/managers",     label: "Managers",           icon: Star },
  { href: "/owner/reports",       label: "Financial Reports",  icon: BarChart3 },
  { href: "/owner/visit-reports", label: "Visit Reports",      icon: ClipboardList },
];

export default function OwnerSidebar({
  name,
  photo,
}: {
  name?: string;
  photo?: string | null;
}) {
  const pathname = usePathname();
  const initial  = (name ?? "O").charAt(0).toUpperCase();

  return (
    <aside className="hidden md:flex w-60 min-h-screen bg-white border-r border-gray-200 flex-col">
      <div className="px-6 py-5 border-b border-gray-100">
        <span className="text-2xl font-bold text-brand-700">Tennvice</span>
      </div>

      {/* Owner identity chip */}
      {name && (
        <div className="px-4 py-3 mx-3 mt-3 mb-1 bg-amber-50 rounded-xl">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full overflow-hidden shrink-0">
              {photo ? (
                <img src={photo} alt={name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-amber-600 flex items-center justify-center text-white text-xs font-bold">
                  {initial}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
              <p className="text-xs text-amber-600">Owner</p>
            </div>
          </div>
        </div>
      )}

      <nav className="flex-1 px-3 py-4 flex flex-col">
        <div className="space-y-1">
          {ownerNav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                (href === "/owner/dashboard" ? pathname === href : pathname.startsWith(href))
                  ? "bg-brand-50 text-brand-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </div>

        <div className="mt-auto pt-3 border-t border-gray-100 space-y-1">
          <Link
            href="/owner/account"
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              pathname.startsWith("/owner/account")
                ? "bg-brand-50 text-brand-700"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <Settings className="w-4 h-4" />
            Account
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
