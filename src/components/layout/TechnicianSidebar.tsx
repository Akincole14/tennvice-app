"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Calendar, Award, Settings, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/tech",              label: "Dashboard",     icon: LayoutDashboard, exact: true },
  { href: "/tech/visits",       label: "My Visits",     icon: Calendar,        exact: false },
  { href: "/tech/certificates", label: "Certificates",  icon: Award,           exact: false },
];

export default function TechnicianSidebar({ name, photo }: { name: string; photo?: string | null }) {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-60 min-h-screen bg-white border-r border-gray-200 flex-col">
      <div className="px-6 py-5 border-b border-gray-100">
        <Link href="/" className="text-2xl font-bold text-brand-700 hover:opacity-80 transition-opacity">Tennvice</Link>
        <p className="text-xs text-gray-400 mt-0.5">Technician portal</p>
      </div>

      {/* Technician identity */}
      <div className="px-4 py-3 mx-3 mt-3 mb-1 bg-brand-50 rounded-xl">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full overflow-hidden shrink-0">
            {photo ? (
              <img src={photo} alt={name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold">
                {name.charAt(0)}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
            <p className="text-xs text-brand-600">Technician</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-3 flex flex-col">
        <div className="space-y-1">
          {nav.map(({ href, label, icon: Icon, exact }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                (exact ? pathname === href : pathname.startsWith(href))
                  ? "bg-brand-50 text-brand-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          ))}
        </div>

        <div className="mt-auto pt-3 border-t border-gray-100 space-y-1">
          <Link
            href="/tech/account"
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              pathname.startsWith("/tech/account")
                ? "bg-brand-50 text-brand-700"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
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
